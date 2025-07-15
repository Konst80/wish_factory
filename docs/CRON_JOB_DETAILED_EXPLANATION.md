# Cron-Job Detailed Explanation - Was passiert genau?

## Das Problem ohne Cron-Jobs

### Live-Berechnung (aktuell):

```typescript
// Jede Similarity-Anfrage macht:
async function checkSimilarity(newWishText: string) {
	// 1. Lade ALLE Wünsche (teuer! 📈)
	const allWishes = await supabase.from('wishes').select('*').eq('status', 'Freigegeben'); // ~1000 Wünsche

	// 2. Berechne zu JEDEM anderen Wunsch (sehr teuer! 💸)
	const similarities = [];
	for (const wish of allWishes) {
		const cosine = calculateCosineSimilarity(newWishText, wish.text);
		const jaccard = calculateJaccardSimilarity(newWishText, wish.text);
		const levenshtein = calculateLevenshteinSimilarity(newWishText, wish.text);
		const tfidf = calculateTfIdfSimilarity(newWishText, wish.text, allWishes);

		similarities.push({
			wishId: wish.id,
			cosine,
			jaccard,
			levenshtein,
			tfidf,
			overall: Math.max(cosine, jaccard, levenshtein, tfidf)
		});
	}

	// 3. Sortiere und filtere
	return similarities
		.filter((s) => s.overall > 0.7)
		.sort((a, b) => b.overall - a.overall)
		.slice(0, 10);
}

// Ergebnis: 1000ms pro Anfrage! 🐌
```

### Problem-Analyse:

```typescript
// Performance-Bottlenecks:
1. Database-Query für alle Wünsche: ~100ms
2. 1000 × 4 Algorithmen = 4000 Berechnungen: ~800ms
3. Text-Normalisierung und Parsing: ~50ms
4. Sortierung und Filterung: ~50ms
// Total: ~1000ms pro Anfrage

// Bei gleichzeitigen Usern:
10 User × 1000ms = 10 Sekunden Server-Last
100 User × 1000ms = 100 Sekunden Server-Last (Crash!) 💥
```

## Die Cron-Job Lösung: Pre-computation

### Grundprinzip:

```typescript
// Statt zur Laufzeit:
'Berechne im Voraus (nachts) und speichere in Database';

// Dann zur Laufzeit:
'Hole fertige Ergebnisse aus Database (50ms statt 1000ms)';
```

### Was passiert im Cron-Job (Step-by-Step):

#### **Schritt 1: Finde veraltete Wünsche**

```typescript
// Hole Wünsche, die Updates brauchen
const outdatedWishes = await supabase
	.from('wishes')
	.select('id, text, updated_at, similarity_updated_at')
	.or('similarity_updated_at.is.null,similarity_updated_at.lt.updated_at')
	.eq('status', 'Freigegeben')
	.limit(50); // Batch-Verarbeitung für Performance

// Beispiel-Ergebnis:
[
	{
		id: 'wish-001',
		text: 'Alles Gute zum Geburtstag!',
		updated_at: '2024-01-15T10:30:00Z',
		similarity_updated_at: null // Noch nie berechnet
	},
	{
		id: 'wish-002',
		text: 'Herzlichen Glückwunsch zum Geburtstag!',
		updated_at: '2024-01-15T11:00:00Z',
		similarity_updated_at: '2024-01-14T02:00:00Z' // Veraltet
	}
];
```

#### **Schritt 2: Für jeden veralteten Wunsch**

```typescript
for (const wish of outdatedWishes) {
	console.log(`🔍 Processing wish: ${wish.id}`);

	// 1. Hole alle anderen Wünsche für Vergleich
	const otherWishes = await supabase
		.from('wishes')
		.select('id, text, type, event_type, language')
		.neq('id', wish.id)
		.eq('status', 'Freigegeben');

	// 2. Lösche alte Similarity-Einträge für diesen Wunsch
	await supabase
		.from('wish_similarities')
		.delete()
		.or(`wish_id_1.eq.${wish.id},wish_id_2.eq.${wish.id}`);

	// 3. Berechne neue Similarities zu ALLEN anderen Wünschen
	const newSimilarities = [];
	for (const otherWish of otherWishes) {
		const similarity = await calculateAllSimilarities(wish, otherWish);

		// Speichere nur signifikante Similarities (>10%)
		if (similarity.overall > 0.1) {
			newSimilarities.push({
				wish_id_1: wish.id,
				wish_id_2: otherWish.id,
				cosine_similarity: similarity.cosine,
				jaccard_similarity: similarity.jaccard,
				levenshtein_similarity: similarity.levenshtein,
				tfidf_similarity: similarity.tfidf,
				overall_similarity: similarity.overall,
				algorithm_used: 'precomputed',
				computed_at: new Date()
			});
		}
	}

	// 4. Speichere alle Similarities in einem Batch
	if (newSimilarities.length > 0) {
		await supabase.from('wish_similarities').insert(newSimilarities);
	}

	// 5. Markiere Wunsch als "similarity updated"
	await supabase.from('wishes').update({ similarity_updated_at: new Date() }).eq('id', wish.id);

	console.log(`✅ Processed ${newSimilarities.length} similarities for wish ${wish.id}`);
}
```

#### **Schritt 3: Cleanup und Optimierung**

```typescript
// Lösche alte Similarity-Einträge (>7 Tage)
await supabase
	.from('wish_similarities')
	.delete()
	.lt('computed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

// Optimiere Database-Indizes
await supabase.rpc('analyze_table', { table_name: 'wish_similarities' });

console.log('🎉 Cron job completed successfully!');
```

## Was passiert zur Laufzeit (mit Caching)?

### Neue optimierte Similarity-Suche:

```typescript
// Jetzt zur Laufzeit (50ms statt 1000ms!):
async function checkSimilarityOptimized(wishId: string) {
	// 1. Hole fertige Similarities aus Cache
	const cachedSimilarities = await supabase
		.from('wish_similarities')
		.select(
			`
      wish_id_2,
      overall_similarity,
      cosine_similarity,
      jaccard_similarity,
      levenshtein_similarity,
      tfidf_similarity,
      wishes!wish_id_2(id, text, type, event_type)
    `
		)
		.eq('wish_id_1', wishId)
		.gt('overall_similarity', 0.7)
		.order('overall_similarity', { ascending: false })
		.limit(10);

	// 2. Formatiere Ergebnisse (bereits sortiert!)
	return cachedSimilarities.map((sim) => ({
		wish: sim.wishes,
		similarity: sim.overall_similarity,
		details: {
			cosine: sim.cosine_similarity,
			jaccard: sim.jaccard_similarity,
			levenshtein: sim.levenshtein_similarity,
			tfidf: sim.tfidf_similarity
		}
	}));
}

// Ergebnis: 50ms pro Anfrage! ⚡ (20x schneller!)
```

## Konkrete Zahlen-Beispiele

### Ohne Cron-Job (Live-Berechnung):

```typescript
// Für 1000 Wünsche in der Datenbank:
const stats = {
  databaseQuery: 100,      // ms - Alle Wünsche laden
  similarities: 999 * 4,   // 3996 Berechnungen
  processing: 800,         // ms - Similarity-Algorithmen
  sorting: 50,             // ms - Sortierung
  total: 1000              // ms pro Anfrage
};

// Bei 10 gleichzeitigen Usern:
10 * 1000ms = 10 Sekunden Server-Last
```

### Mit Cron-Job (Pre-computation):

```typescript
// Zur Laufzeit:
const optimizedStats = {
  databaseQuery: 40,       // ms - Nur Cache-Abfrage
  processing: 5,           // ms - Formatierung
  sorting: 5,              // ms - Bereits vorsortiert
  total: 50                // ms pro Anfrage
};

// Bei 10 gleichzeitigen Usern:
10 * 50ms = 500ms Server-Last (20x besser!)
```

## Warum ist der Cron-Job nötig?

### **1. Performance-Skalierung**

```typescript
// Ohne Cron: O(n²) pro Anfrage
// Mit Cron: O(1) pro Anfrage

// Beispiel bei 1000 Wünschen:
Live-Berechnung: 1000 × 999 = 999.000 Operationen pro Anfrage
Pre-computation: 1 × Database-Query = 1 Operation pro Anfrage
```

### **2. Server-Ressourcen**

```typescript
// Ohne Cron:
CPU-Last: Hoch bei jeder Anfrage
Memory: Hoch (alle Wünsche laden)
Database: Viele komplexe Queries

// Mit Cron:
CPU-Last: Niedrig (nur nachts)
Memory: Niedrig (nur Cache-Abfrage)
Database: Einfache, optimierte Queries
```

### **3. User Experience**

```typescript
// Ohne Cron:
User klickt Button → 1-2 Sekunden warten → Ergebnis
"Warum ist das so langsam?" 😤

// Mit Cron:
User klickt Button → Sofort Ergebnis
"Wow, das ist schnell!" 😍
```

### **4. Kostenoptimierung**

```typescript
// Ohne Cron (bei 1000 Requests/Tag):
1000 × 1000ms = 1.000.000ms = 16,7 Minuten Server-Zeit/Tag

// Mit Cron:
1 × 5 Minuten (nachts) + 1000 × 50ms = 350 Sekunden/Tag
Einsparung: 95% Server-Zeit!
```

## Timing: Wann läuft der Cron-Job?

### **Warum nachts (2 Uhr)?**

```typescript
// Optimale Zeit-Wahl:
const cronSchedule = {
  time: '2:00 AM',
  reason: [
    'Niedrige User-Aktivität',
    'Günstige Server-Ressourcen',
    'Weniger Database-Konkurrenz',
    'Vor Arbeitszeit verfügbar'
  ]
};

// Täglich vs. Stündlich:
Daily: Ausreichend für die meisten Änderungen
Hourly: Nur bei sehr hoher Aktivität nötig
```

### **Batch-Verarbeitung (50 Wünsche)**

```typescript
// Warum nur 50 Wünsche pro Lauf?
const batchSize = 50;
const reasons = [
  'Verhindert Timeouts (max 5 Minuten)',
  'Reduziert Server-Last',
  'Ermöglicht Fortschritt-Tracking',
  'Bessere Fehlerbehandlung'
];

// Bei 1000 Wünschen:
1000 ÷ 50 = 20 Tage für vollständige Neuberechnung
(Normal: 1-2 neue Wünsche/Tag → 1-2 Tage bis Update)
```

## Fallback-Strategie

### **Was wenn Cache fehlt?**

```typescript
async function checkSimilarityWithFallback(wishId: string) {
	// 1. Versuche Cache zuerst
	const cached = await getCachedSimilarities(wishId);

	if (cached.length > 0) {
		return cached; // 50ms ⚡
	}

	// 2. Fallback: Live-Berechnung
	console.log('⚠️ No cache found, computing live...');
	const live = await computeLiveSimilarities(wishId);

	// 3. Speichere Ergebnis für nächstes Mal
	await cacheSimilarities(wishId, live);

	return live; // 1000ms 🐌 (aber nur einmal)
}
```

## Zusammenfassung

### **Cron-Job macht:**

1. **Findet veraltete Wünsche** (similarity_updated_at < updated_at)
2. **Berechnet Similarities zu allen anderen** (4 Algorithmen)
3. **Speichert Ergebnisse in wish_similarities Tabelle**
4. **Markiert Wunsch als aktualisiert** (similarity_updated_at = NOW)
5. **Bereinigt alte Einträge** (> 7 Tage)

### **Ergebnis:**

- **Performance**: 50ms statt 1000ms (20x schneller)
- **Skalierung**: Unbegrenzte gleichzeitige User
- **Kosten**: 95% weniger Server-Zeit
- **UX**: Sofortige Ergebnisse statt Wartezeit

### **Wann ist es nötig?**

- ✅ **Bei mehr als 100 Wünschen** in der Datenbank
- ✅ **Bei mehreren gleichzeitigen Usern**
- ✅ **Für bessere User Experience**
- ✅ **Zur Kostensenkung**

**Der Cron-Job ist der Schlüssel zur Skalierung! 🚀**
