# SvelteKit Entwicklungsregeln & Best Practices

Dieses Dokument dient als verbindliches Regelwerk und Styleguide für die Entwicklung von Webanwendungen mit Svelte und SvelteKit. Es bildet die technische Grundlage ("Blueprint") für ein KI-gestütztes Entwicklungssystem und stellt sicher, dass der generierte Code modern, modular, wartbar, sicher und performant ist. Der Fokus liegt ausschließlich auf den technischen und strukturellen Regeln der Entwicklung; anwendungsspezifische Funktionen (Features) werden aus einem separaten Dokument, der Functional Requirements Specification (FRS), entnommen.

## 1. Grundprinzipien

Die folgenden Grundprinzipien bilden die philosophische Basis für jede Entwicklungsentscheidung im Rahmen dieses Regelwerks. Sie sind nicht als lose Empfehlungen, sondern als fundamentale Direktiven zu verstehen, die die Qualität und Langlebigkeit der Software sicherstellen.

### 1.1 Modularität

**Regel:** Code MUSS in kleine, wiederverwendbare und unabhängige Module aufgeteilt werden. Diese Module umfassen Svelte-Komponenten, reine TypeScript/JavaScript-Funktionen und Svelte Stores. Komponenten sind explizit so zu entwerfen, dass sie durch Komposition (composition) zusammengefügt werden können, anstatt monolithische Strukturen zu schaffen, die mehrere, unzusammenhängende Aufgabenbereiche abdecken.

**Begründung:** Die Zerlegung einer komplexen Anwendung in kleine, fokussierte Bausteine ist fundamental für eine skalierbare Architektur. Modulare Komponenten fördern die Wiederverwendbarkeit über verschiedene Teile der Anwendung hinweg, was die Entwicklungszeit reduziert und die Konsistenz der Benutzeroberfläche erhöht. Unabhängige Module lassen sich isoliert testen, was die Komplexität von Unit- und Komponententests drastisch reduziert und die Fehlerlokalisierung vereinfacht. Darüber hinaus sind kleinere, gut definierte Code-Einheiten für Entwickler (sowohl menschliche als auch KI-basierte) leichter zu verstehen, zu warten und zu debuggen. Ein gutes Beispiel ist die Aufteilung einer komplexen Ansicht in Komponenten wie `UserProfile.svelte`, `UserPostList.svelte` und `Avatar.svelte`, anstatt alles in einer einzigen `ProfilePage.svelte`-Datei zu verwalten.

### 1.2 Single Responsibility Principle (SRP)

**Regel:** Jedes Modul – sei es eine Komponente, eine Funktion oder ein Store – MUSS genau eine, klar definierte Aufgabe haben und somit nur einen einzigen Grund für eine Änderung besitzen. Sobald ein Modul beginnt, mehrere Verantwortlichkeiten zu übernehmen, MUSS es in kleinere, spezialisierte Module refaktorisiert werden.

**Begründung:** Das Single Responsibility Principle ist die logische Konsequenz der Modularität auf funktionaler Ebene. Es minimiert die Kopplung zwischen verschiedenen Teilen des Systems. Wenn eine Komponente nur für die Darstellung von Benutzerdaten zuständig ist, wird eine Änderung an der API-Logik für das Laden dieser Daten diese Komponente nicht direkt beeinflussen, solange die Datenschnittstelle (Props) stabil bleibt. Dies gilt insbesondere für Svelte Stores: Ein überladener Store, der den Zustand für Benutzer, Warenkorb und UI-Theme gleichzeitig verwaltet, führt zu unnötigen Re-Renderings und schwer nachvollziehbaren Abhängigkeiten. Stattdessen MÜSSEN separate Stores wie `userStore.ts`, `cartStore.ts` und `themeStore.ts` erstellt werden, von denen jeder eine einzige Verantwortung trägt.

### 1.3 Konvention vor Konfiguration

**Regel:** Die von SvelteKit vorgegebenen Konventionen MÜSSEN strikt befolgt werden. Dies betrifft insbesondere das dateisystembasierte Routing (`/src/routes`), die Benennung von Spezialdateien (`+page.svelte`, `+page.server.js`, `+layout.svelte`, `+server.js`) und die Verwendung von Environment-Variablen. Von diesen Konventionen darf nur in außergewöhnlichen, explizit dokumentierten und genehmigten Fällen abgewichen werden.

**Begründung:** SvelteKit ist als "Convention-over-Configuration"-Framework konzipiert, was bedeutet, dass es durch die Einhaltung seiner Konventionen einen Großteil der Konfigurationsarbeit und des Boilerplate-Codes eliminiert. Diese Konventionen schaffen eine standardisierte und vorhersehbare Projektstruktur. Dies erleichtert nicht nur neuen Entwicklern den Einstieg, sondern ist auch für automatisierte Werkzeuge und das KI-System von entscheidender Bedeutung, da sie sich auf eine bekannte Struktur verlassen können, um Code zu analysieren, zu generieren und zu modifizieren.

Die Prinzipien der Modularität, des SRP und der Konventionen sind keine isolierten Regeln, sondern bilden ein sich gegenseitig verstärkendes System. Die Einhaltung der SvelteKit-Konventionen führt fast zwangsläufig zu einer besseren Architektur. Wenn ein Entwickler die Konvention des file-based Routings befolgt und ein neues Feature unter `/src/routes/feature-name/` anlegt, bündelt er den Code logisch an einem Ort. In diesem Verzeichnis platziert er eine `+page.svelte` für die Darstellung und eine `+page.server.js` für die serverseitige Logik. Damit wendet er bereits das Single Responsibility Principle auf Feature-Ebene an und schafft ein modulares Verzeichnis. Dieses Systemdenken ist entscheidend für die Erstellung von qualitativ hochwertigem Code.

### 1.4 Progressive Enhancement

**Regel:** Jede Anwendung MUSS so entwickelt werden, dass eine funktionale Kernbasis ausschließlich mit HTML und CSS bereitgestellt wird. JavaScript dient der schrittweisen Verbesserung (Enhancement) des Benutzererlebnisses, darf aber für die grundlegende Funktionalität – insbesondere die Seitennavigation und die Übermittlung von Formularen – nicht zwingend erforderlich sein. Dies wird durch die standardmäßige Verwendung von `<a>`-Elementen für Links und SvelteKit Form Actions für Formulare sichergestellt.

**Begründung:** Dieses Prinzip garantiert maximale Robustheit, Zugänglichkeit und Performance. Die Anwendung bleibt funktionsfähig, auch wenn JavaScript fehlschlägt, durch Firewalls blockiert wird, in langsamen Netzwerken nur langsam lädt oder von Nutzern deaktiviert ist. SvelteKit ist von Grund auf darauf ausgelegt, diesen Ansatz zu unterstützen. Serverseitig gerenderte `<a>`-Tags funktionieren als normale Seitenwechsel. Formulare, die mit Form Actions implementiert sind, führen eine standardmäßige HTTP-Anfrage durch. Erst wenn JavaScript verfügbar ist, übernimmt SvelteKit und erweitert die Funktionalität zu schnellen, clientseitigen Navigationen und AJAX-Formularübermittlungen via `use:enhance`, ohne dass der Entwickler zwei separate Implementierungen schreiben muss.

### 1.5 Aktualität (Up-to-date)

**Regel:** Alle eingesetzten Technologien, Bibliotheken und Werkzeuge – einschließlich Node.js, Svelte, SvelteKit und sämtlicher npm-Abhängigkeiten – MÜSSEN in ihren jeweils neuesten stabilen Versionen verwendet werden. Es ist ein automatisierter Prozess zur regelmäßigen Überprüfung und Aktualisierung von Abhängigkeiten (z.B. mittels Dependabot auf GitHub) zu implementieren und zu pflegen.

**Begründung:** Die Webentwicklung ist ein sich schnell entwickelndes Feld. Die Verwendung der neuesten stabilen Versionen stellt sicher, dass das Projekt von wichtigen Sicherheitsupdates, Performance-Verbesserungen, Fehlerbehebungen und neuen Features profitiert. Svelte und SvelteKit werden aktiv weiterentwickelt; das Festhalten an veralteten Versionen führt zu technischer Schuld, potenziellen Sicherheitslücken und erschwert zukünftige Upgrades. Ein proaktiver Update-Prozess ist entscheidend für die Langlebigkeit und Sicherheit der Anwendung.

## 2. Projekt- und Verzeichnisstruktur

Eine klare, konsistente und skalierbare Verzeichnisstruktur ist die physische Manifestation der architektonischen Prinzipien. Die folgende Struktur ist für alle SvelteKit-Projekte verbindlich.

### 2.1 Wurzelverzeichnis (/)

- **svelte.config.js**: Zentrale Konfigurationsdatei für Svelte und SvelteKit. Hier werden Adapter, Preprocessors und Kit-spezifische Aliase konfiguriert.
- **vite.config.js**: Konfiguration für den Vite-Build-Server. Enthält Plugins und Testkonfigurationen (z.B. für Vitest).
- **package.json**: Definiert Projektmetadaten, Abhängigkeiten (dependencies, devDependencies) und npm-Skripte. Muss `"type": "module"` enthalten.
- **tsconfig.json**: Konfiguration für den TypeScript-Compiler. Muss den strict-Modus aktivieren und von der SvelteKit-generierten Konfiguration in `.svelte-kit/tsconfig.json` erben.
- **.prettierrc / eslint.config.js**: Konfigurationsdateien für Code-Formatierung und Linting. Ihre Anwesenheit und Konfiguration sind obligatorisch.

### 2.2 /src - Das Herz der Anwendung

#### 2.2.1 /src/routes/

Dieser Ordner ist das Kernstück des SvelteKit-Routings. Seine Struktur definiert direkt die URL-Pfade der Anwendung. Er darf ausschließlich für Routing-bezogene Dateien verwendet werden.

- **+page.svelte**: Definiert die UI-Komponente einer Seite. Diese Datei sollte primär Darstellungslogik enthalten und Daten über Props von `+page.server.js` empfangen. Sie ist das visuelle Äquivalent einer Route.
- **+page.server.js**: Enthält serverseitige Logik, die ausschließlich auf dem Server ausgeführt wird. Dies ist der einzige Ort für load-Funktionen, die auf Datenbanken oder private APIs zugreifen, sowie für Form Actions.
- **+layout.svelte**: Definiert eine Layout-Komponente, die eine UI-Hülle für ein gesamtes Segment der Anwendung und alle untergeordneten Routen bereitstellt. Typische Anwendungsfälle sind Navigationsleisten, Footer oder Seitenleisten, die auf mehreren Seiten erscheinen.
- **+layout.server.js**: Definiert eine load-Funktion, deren Daten dem zugehörigen Layout und allen untergeordneten Seiten zur Verfügung stehen. Dies ist ideal für Daten, die in einem ganzen App-Bereich benötigt werden, z.B. Benutzerinformationen für eine Navigationsleiste.
- **+server.js**: Implementiert reine API-Endpunkte. Diese Dateien enthalten Handler für HTTP-Methoden wie GET, POST, PUT, DELETE und geben eine Response zurück. Sie dienen der Trennung von API-Logik und UI-Rendering.

#### 2.2.2 /src/lib/

Dieser Ordner ist für anwendungsweiten, wiederverwendbaren Code vorgesehen, der nicht direkt einer Route zugeordnet ist. Alle Inhalte sind über den `$lib`-Alias importierbar, was die Importpfade vereinfacht und von der Dateistruktur entkoppelt.

- **/src/lib/components/**: Enthält globale, wiederverwendbare Svelte-Komponenten, die in verschiedenen Teilen der Anwendung genutzt werden.
  - **Regel**: Die Strukturierung innerhalb dieses Ordners MUSS projektweit konsistent sein. Es sind zwei Strategien erlaubt:
    1. **Strukturierung nach Feature**: Komponenten werden nach ihrer funktionalen Domäne gruppiert (z.B. `/src/lib/components/authentication/`, `/src/lib/components/checkout/`). Dies wird für größere Anwendungen empfohlen.
    2. **Strukturierung nach Typ**: Komponenten werden nach ihrer Art gruppiert (z.B. `/src/lib/components/ui/` für generische UI-Elemente wie Buttons und Inputs, `/src/lib/components/forms/` für Formular-spezifische Kompositionen).

- **/src/lib/utils/**: Beinhaltet reine Hilfsfunktionen (Utility Functions) in TypeScript/JavaScript, die keine Svelte-spezifische Logik enthalten (z.B. `formatDate.ts`, `validation.ts`, `cn.ts` für die dynamische Kombination von Tailwind-Klassen).

- **/src/lib/stores/**: Definiert Svelte Stores für das globale oder feature-übergreifende State Management. Jeder Store SOLLTE in einer eigenen, nach seiner Domäne benannten Datei liegen (z.B. `userStore.ts`, `cartStore.ts`).

- **/src/lib/types/**: Zentraler Ort für globale TypeScript-Typdefinitionen, interface-Deklarationen und enum-ähnliche Konstantenobjekte (z.B. `User.ts`, `Product.ts`, `Api.ts`). Dies fördert die Typsicherheit im gesamten Projekt.

- **/src/lib/server/**: Enthält Code, der ausschließlich und garantiert nur auf dem Server ausgeführt werden darf.
  - **Regel**: Datenbank-Clients (z.B. die Prisma-Client-Instanz), geheime API-Schlüssel, und andere sensible serverseitige Module MÜSSEN hier platziert werden.
  - **Architektonische Bedeutung**: Die Verzeichnisstruktur von SvelteKit ist mehr als nur eine organisatorische Konvention; sie ist ein fundamentales Sicherheits- und Performance-Feature. Die Unterscheidung zwischen `/src/lib/` (potenziell universell) und `/src/lib/server/` (strikt serverseitig) ist eine vom Build-System erzwungene Grenze. Der Vite-Bundler ist so konfiguriert, dass er bei der Erstellung des Client-Bundles jeden Importversuch aus `/src/lib/server/` blockiert und einen Build-Fehler erzeugt. Dies hat zwei entscheidende Konsequenzen:
    1. **Sicherheit durch Design**: Das Risiko, sensible Informationen wie Datenbank-Verbindungsstrings oder API-Schlüssel versehentlich an den Client zu senden, wird auf Build-Ebene eliminiert. Die Verantwortung wird von der reinen Entwicklerdisziplin auf eine vom Framework erzwungene, fehlersichere Regel verlagert.
    2. **Automatische Performance-Optimierung**: Da der Code aus `/src/lib/server/` garantiert nicht im Client-Bundle landet, wird die für den Browser bestimmte JavaScript-Größe automatisch minimiert. Schwere Bibliotheken wie ein vollständiger Datenbank-Client werden niemals versehentlich zum Download für den Benutzer angeboten.

Das KI-System muss diese Verzeichnisse daher nicht nur als Ablageorte, sondern als Zonen mit unterschiedlichen Sicherheits- und Ausführungskontexten behandeln.

## 3. Komponenten-Design

Dieser Abschnitt kodifiziert die Regeln für die Erstellung von robusten, wartbaren und wiederverwendbaren Svelte-Komponenten. Die Einhaltung dieser Regeln führt zu einer klaren und typsicheren Komponenten-API.

### 3.1 Props (Eigenschaften)

Props sind die Schnittstelle, über die eine Elternkomponente Daten an eine Kindkomponente übergibt.

- **Regel: Strikte Typisierung**: Alle Props MÜSSEN mit TypeScript streng typisiert werden. Hierfür ist ein interface namens `Props` innerhalb des `<script lang="ts">`-Tags zu definieren. Die Verwendung des Typs `any` ist strikt verboten.
- **Regel: Deklaration**: Die Deklaration von Props MUSS unter Verwendung der `$props()`-Rune von Svelte 5 erfolgen: `let { propName,... }: Props = $props();`.
- **Regel: Benennung**: Prop-Namen MÜSSEN die camelCase-Schreibweise verwenden.
- **Regel: Unveränderlichkeit**: Props werden von der Elternkomponente verwaltet und DÜRFEN innerhalb der Kindkomponente nicht direkt mutiert werden. Eine Änderung eines Props von `count++` ist ein Anti-Pattern. Wenn eine Kindkomponente eine Zustandsänderung an die Elternkomponente melden muss, MUSS dies über ein Event geschehen.
- **Best Practice: Wrapper-Komponenten**: Für Komponenten, die native HTML-Elemente kapseln (z.B. ein benutzerdefinierter `<Button>`), SOLLTEN die `HTML...Attributes`-Interfaces aus `svelte/elements` erweitert werden. Dies stellt sicher, dass alle Standard-HTML-Attribute (wie `class`, `id`, `disabled`, ARIA-Attribute) typsicher an das darunterliegende Element weitergegeben werden können, ohne `$$restProps` zu verwenden, was typsicherer ist.

**Beispiel für eine korrekt definierte Komponente:**

```svelte
<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary';
	}

	let { variant = 'primary', children, ...rest }: Props = $props();
</script>

<button
	class:btn-primary={variant === 'primary'}
	class:btn-secondary={variant === 'secondary'}
	{...rest}
>
	{@render children()}
</button>
```

### 3.2 Events

Events sind der standardisierte Mechanismus für die Kommunikation von einer Kind- zu einer Elternkomponente.

- **Regel: Verwendung von createEventDispatcher**: Die Kommunikation von unten nach oben MUSS über Events erfolgen, die mit `createEventDispatcher` aus dem `svelte`-Paket erstellt werden. Die Übergabe von Event-Handler-Funktionen als Props (z.B. `onClick={...}`) ist zu vermeiden, da dies eine engere Kopplung erzeugt und weniger idiomatisch ist.
- **Regel: Typisierung des Dispatchers**: Der Event-Dispatcher MUSS typisiert werden, um die erlaubten Event-Namen und die Datentypen ihrer detail-Payloads explizit zu definieren. Dies ermöglicht eine vollständige Typsicherheit auf der Seite der Elternkomponente.

**Beispiel für eine Komponente mit typisierten Events:**

```svelte
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		save: { content: string };
		cancel: null; // Kein Payload
	}>();

	function handleSave() {
		dispatch('save', { content: 'Some data' });
	}
</script>

<button on:click={handleSave}>Save</button>
<button on:click={() => dispatch('cancel', null)}>Cancel</button>
```

```svelte
<script lang="ts">
	import ChildComponent from './ChildComponent.svelte';

	function handleSave(event: CustomEvent<{ content: string }>) {
		// event.detail ist jetzt typsicher als { content: string } bekannt
		console.log(event.detail.content);
	}
</script>

<ChildComponent on:save={handleSave} on:cancel={() => console.log('Cancelled')} />
```

### 3.3 Slots

Slots sind Platzhalter, die es einer Elternkomponente ermöglichen, Markup in eine Kindkomponente zu injizieren, was zu hochgradig flexiblen und komponierbaren Komponenten führt.

- **Regel: Default Slot**: Für den primären, unspezifischen Inhaltsbereich einer Komponente (z.B. der Text in einem Button) MUSS der Default Slot (`<slot />`) verwendet werden.
- **Regel: Named Slots**: Für strukturierte Komponenten mit mehreren definierten Injektionspunkten (z.B. Header, Body und Footer einer Card-Komponente) MÜSSEN benannte Slots (`<slot name="header" />`) verwendet werden. Dies schafft eine klare und explizite API für die Inhaltsstruktur.
- **Regel: Slot Props (let:)**: Wenn eine Komponente Daten oder Zustand an den von ihr gerenderten Slot-Inhalt zurückgeben muss, MUSS dies über Slot-Props geschehen. Ein typischer Anwendungsfall ist eine Listenkomponente, die jedes einzelne Listenelement an das Slot-Template übergibt, damit die Elternkomponente das Rendering jedes Elements steuern kann.

### 3.4 Reaktivität ($:)

Sveltes Reaktivität ist ein mächtiges Werkzeug, um den Zustand der Anwendung konsistent zu halten.

- **Regel: Verwendung für abgeleiteten Zustand**: Reaktive Deklarationen (`$:`) SOLLTEN primär für die Berechnung von abgeleitetem Zustand verwendet werden, der von anderen reaktiven Werten abhängt (z.B. `$: doubled = count * 2`).
- **Regel: Verwendung für Side Effects**: Side Effects, die als Reaktion auf eine Zustandsänderung ausgeführt werden müssen (z.B. das Speichern von Daten im localStorage, das Protokollieren von Änderungen), SOLLTEN in reaktiven Blöcken (`$: {...}`) gekapselt werden.
- **Wichtiger Hinweis zur Funktionsweise**: Sveltes Reaktivität wird durch Zuweisungen (`=`) ausgelöst. Die direkte Mutation von Objekten oder Arrays (z.B. mit `array.push()` oder `object.property = value`) ohne eine anschließende Neuzuweisung der Variable selbst (`array = array`) löst kein Update aus. Dies ist ein häufiger Fehler, der vermieden werden muss.

Die Kombination aus typsicheren Props, Events und Slots schafft einen robusten "Component Contract". Dieser Vertrag ist eine formale, vom Compiler überprüfbare Spezifikation der API einer Komponente:

1. Props definieren die Eingabeparameter.
2. Events definieren die Ausgabeereignisse.
3. Slots definieren die Inhalts-API.

Für ein KI-System ist dieser Vertrag von unschätzbarem Wert. Er kann geparst werden, um exakt zu verstehen, wie eine Komponente zu verwenden ist: welche Daten sie benötigt, welche Ereignisse sie auslöst und wie sie mit Inhalt gefüllt werden kann. Dies ermöglicht eine automatisierte und fehlerfreie Komposition von Benutzeroberflächen, da die "Verbindungsstellen" der Komponenten nicht nur dokumentiert, sondern vom Typsystem garantiert werden.

## 4. State Management

Die Wahl der richtigen State-Management-Strategie ist entscheidend für die Wartbarkeit und Skalierbarkeit einer Anwendung. Die folgende Hierarchie ist als Entscheidungsmatrix zu verstehen, die von der einfachsten zur komplexesten Lösung führt.

### 4.1 Hierarchie der Strategien

#### 4.1.1 1. Priorität: Lokaler State

- **Regel**: Für Zustand, der ausschließlich innerhalb einer einzigen Komponente und ihrer direkten Kind-Elemente relevant ist, MUSS der lokale State verwendet werden. In Svelte 5 geschieht dies durch die `$state()`-Rune (z.B. `let count = $state(0);`), in älteren Versionen durch einfache let-Variablen.
- **Begründung**: Dies ist die einfachste, performanteste und am leichtesten nachvollziehbare Form des State Managements. Es vermeidet unnötige Komplexität und globale Abhängigkeiten für rein lokale Anliegen (z.B. der `isOpen`-Zustand eines Dropdowns).

#### 4.1.2 2. Priorität: Svelte Stores

- **Regel**: Für Zustand, der über mehrere, nicht direkt in einer Eltern-Kind-Beziehung stehende Komponenten hinweg geteilt oder synchronisiert werden muss, SIND Svelte Stores die bevorzugte und standardmäßige Methode.
- **Anwendung**:
  - `writable`: Für Daten, die von überall gelesen und geschrieben werden können (z.B. ein Warenkorb).
  - `readable`: Für Daten, die von einer Quelle bereitgestellt, aber nicht von den Komponenten geändert werden sollen (z.B. Benutzerinformationen nach dem Login).
  - `derived`: Für Zustand, der sich von einem oder mehreren anderen Stores ableitet (z.B. die Gesamtsumme des Warenkorbs).
- **Struktur**: Stores MÜSSEN im Verzeichnis `/src/lib/stores/` abgelegt und nach ihrer funktionalen Domäne aufgeteilt werden, um das Single Responsibility Principle zu wahren (z.B. `user.ts`, `notifications.ts`).

#### 4.1.3 3. Priorität: Context API

- **Regel**: Die Context API (`setContext`, `getContext`) DARF NUR in seltenen Ausnahmefällen verwendet werden. Ein legitimer Anwendungsfall ist das Durchreichen von Daten durch eine tief verschachtelte Komponentenhierarchie, bei der die Erstellung eines globalen Stores einen unverhältnismäßigen Overhead darstellen würde und die Daten klar an diesen spezifischen Komponentenbaum gebunden sind.
- **Begründung**: Im Gegensatz zu Stores, die entkoppelt sind, erzeugt die Context API eine starke Kopplung zwischen Komponenten und ihrer Abstammungslinie im DOM-Baum. Ein Kind kann den Kontext nur empfangen, wenn ein Vorfahre ihn gesetzt hat. Stores sind in der Regel die flexiblere und testfreundlichere Lösung.

### 4.2 Wichtige Regel: Vermeidung von serverseitigem Shared State

- **Regel**: In serverseitigem Code (`+page.server.js`, `+server.js`, `/src/lib/server/`) DÜRFEN unter keinen Umständen zustandsbehaftete Variablen im Modul-Scope deklariert werden, die für einen einzelnen Benutzer oder eine einzelne Anfrage eindeutig sein müssen.

**Beispiel für ein Anti-Pattern:**

```javascript
// In +page.server.js - FALSCH!
let user; // Diese Variable wird von ALLEN Benutzern geteilt!

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		//... validiere Benutzer
		user = { name: data.get('username') }; // Setzt die globale Variable!
	}
};
```

- **Begründung**: Der SvelteKit-Server ist ein langlebiger Prozess, der Anfragen von vielen verschiedenen Benutzern gleichzeitig bearbeitet. Eine Variable im Modul-Scope ist global für den gesamten Serverprozess. Wenn Benutzer A sich anmeldet und die `user`-Variable setzt, sieht Benutzer B, der die Seite als Nächstes aufruft, die Daten von Benutzer A. Dies ist ein schwerwiegendes Sicherheitsrisiko (Data Leak). Der Zustand eines Benutzers MUSS immer an den Request-Kontext gebunden sein, typischerweise über Cookies, und in einer externen Datenbank persistiert werden.

## 5. Data Loading & API-Routen

Dieser Abschnitt definiert die verbindlichen Muster für die Datenbeschaffung und die Kommunikation mit dem Server. Die Einhaltung dieser Muster ist entscheidend für Performance, SEO und die Robustheit der Anwendung.

### 5.1 load-Funktion als einzige Datenquelle für Seiten

- **Regel**: Alle für das initiale Rendern einer Seite oder eines Layouts erforderlichen Daten MÜSSEN in der load-Funktion einer `+page.server.js`- oder `+layout.server.js`-Datei geladen werden. Das Abrufen von Initialdaten innerhalb von `.svelte`-Komponenten (z.B. in `onMount` via `fetch`) ist strikt verboten.
- **Begründung**: Dieses Muster ist der Kern von SvelteKits datengetriebener Architektur:
  1.  **SSR-Fähigkeit**: Nur Daten, die in einer serverseitigen load-Funktion geladen werden, stehen für das Server-Side Rendering (SSR) zur Verfügung. Dies ist unerlässlich für eine gute SEO und eine schnelle "Time to First Contentful Paint" (FCP), da der Browser sofort gerendertes HTML erhält.
  2.  **Klare Trennung**: Die Logik zur Datenbeschaffung wird sauber von der Darstellungslogik getrennt. Die Komponente ist "dumm" und weiß nur, wie sie die ihr übergebenen Daten (data-Prop) rendern muss.
  3.  **Zentralisierung**: Der gesamte Datenbedarf einer Route ist an einem einzigen, vorhersehbaren Ort (`+page.server.js`) deklariert, was die Wartung und das Debugging erheblich vereinfacht.

### 5.2 Verwendung der SvelteKit fetch-API

- **Regel**: Innerhalb von load-Funktionen und Form Actions MUSS die von SvelteKit bereitgestellte, instrumentierte `fetch`-Funktion verwendet werden, die über das `event`-Objekt zugänglich ist (z.B. `event.fetch`). Die globale `fetch`-API darf hier nicht verwendet werden.
- **Begründung**: Die `fetch`-Variante von SvelteKit ist "intelligent" und bietet entscheidende Vorteile:
  1.  **Credential Forwarding**: Sie leitet automatisch Cookies und Authorization-Header der ursprünglichen Anfrage an den Ziel-Endpunkt weiter. Dies ist für authentifizierte API-Anfragen unerlässlich und erspart manuelles Header-Management.
  2.  **Server-interne Optimierung**: Wenn `fetch` auf dem Server verwendet wird, um einen internen API-Endpunkt (eine `+server.js`-Route) derselben Anwendung aufzurufen, wird kein echter HTTP-Netzwerk-Request ausgelöst. Stattdessen ruft SvelteKit die entsprechende Handler-Funktion direkt auf. Dies umgeht den gesamten Netzwerk-Stack und reduziert die Latenz drastisch.
  3.  **Konsistenz**: Die API ist auf dem Server und dem Client identisch, was den Code universeller macht.

### 5.3 API-Endpunkte mit +server.js

- **Regel**: Dedizierte API-Routen, die Daten im JSON-Format oder anderen Nicht-HTML-Formaten für den Client oder für externe Dienste bereitstellen, MÜSSEN als `+server.js`-Dateien implementiert werden. Diese Dateien exportieren Funktionen, die nach den HTTP-Verben benannt sind (GET, POST, PUT, DELETE, etc.).
- **Begründung**: Dies ermöglicht die Erstellung einer sauberen, von der UI entkoppelten REST- oder GraphQL-API. Die Geschäftslogik der API wird von der Darstellungslogik der Seiten getrennt, was die Wiederverwendbarkeit und Testbarkeit der API-Logik verbessert. Die `json()`-Hilfsfunktion aus `@sveltejs/kit` SOLLTE für das Erstellen von JSON-Antworten verwendet werden.

### 5.4 Form Actions für Formularverarbeitung

- **Regel**: Jede Formularübermittlung, die eine Zustandsänderung auf dem Server bewirkt (Create, Update, Delete), MUSS über SvelteKits "Form Actions" abgewickelt werden. Die Logik MUSS in der `actions`-Exportvariable einer `+page.server.js`-Datei definiert werden.
- **Begründung**: Form Actions sind der Eckpfeiler des Progressive Enhancement in SvelteKit:
  1.  **Robustheit**: Ein `<form method="POST">` funktioniert standardmäßig ohne JavaScript. Der Browser sendet eine normale POST-Anfrage, und der Server antwortet. Die Anwendung ist somit von Grund auf robust.
  2.  **Enhancement**: Durch Hinzufügen der `use:enhance`-Direktive zum `<form>`-Element wird das Erlebnis bei aktiviertem JavaScript verbessert. SvelteKit fängt die Anfrage ab, sendet sie per `fetch` im Hintergrund und aktualisiert die Seite intelligent, ohne einen kompletten Reload. Dies führt zu einer schnellen, SPA-ähnlichen Benutzererfahrung.
- **Regel: Serverseitige Validierung**: Jede Form Action MUSS die eingehenden FormData auf dem Server validieren. Es darf sich niemals auf die clientseitige Validierung allein verlassen werden.
- **Regel: Fehlerbehandlung mit fail**: Um Validierungsfehler oder andere erwartete Fehler an das Frontend zurückzugeben, MUSS die `fail(status, data)`-Funktion aus `@sveltejs/kit` verwendet werden. Dies sendet einen entsprechenden HTTP-Statuscode (z.B. 422 für unprocessable entity) und hängt die Fehlerdaten an die `form`-Prop der Seite an, die dann im UI angezeigt werden kann.

## 6. Styling

Eine konsistente und wartbare Styling-Strategie ist entscheidend für die Entwicklung eines kohärenten Design-Systems. Die folgenden Regeln definieren den bevorzugten Ansatz.

### 6.1 Scoped Styles als Standard

- **Regel**: Styles MÜSSEN standardmäßig direkt in der `<style>`-Sektion einer `.svelte`-Komponentendatei geschrieben werden.
- **Begründung**: Svelte verarbeitet diese Styles zur Build-Zeit und fügt jedem Selektor eine einzigartige Hash-Klasse hinzu. Dies sorgt für ein automatisches und performantes CSS-Scoping. Die Stile einer Komponente können so niemals versehentlich andere Komponenten beeinflussen ("leaken"), was globale Stilkonflikte verhindert und die Modularität und Wartbarkeit des CSS-Codes drastisch verbessert.

### 6.2 Globale Styles

- **Regel**: Stile, die die gesamte Anwendung betreffen, wie CSS-Variablen für das Theming, grundlegende Typografie, Font-Definitionen oder CSS-Resets, SOLLTEN in einer einzigen, zentralen Datei unter `/src/app.css` definiert werden. Diese Datei MUSS dann im Root-Layout (`/src/routes/+layout.svelte`) importiert werden, um global verfügbar zu sein.
- **Best Practice**: Die Verwendung des `:global()`-Modifikators innerhalb von Komponenten-`<style>`-Tags ist zu minimieren. Er sollte nur dann verwendet werden, wenn gezielt ein Kind-Element gestylt werden muss, das nicht direkt Teil der Komponente ist (z.B. aus einem Slot gerendertes Markup). Für anwendungsweite Stile ist `/src/app.css` vorzuziehen.

### 6.3 CSS-Frameworks

- **Empfehlung**: Die Verwendung eines Utility-First-CSS-Frameworks, insbesondere Tailwind CSS, wird für alle Projekte dringend empfohlen.
- **Regel**: Bei Verwendung von Tailwind CSS MUSS die Konfiguration (`tailwind.config.js`) zentral im Projektwurzelverzeichnis verwaltet und versioniert werden. Die Verwendung der `@apply`-Direktive in Komponenten-`<style>`-Tags SOLLTE auf ein Minimum beschränkt werden. Stattdessen sind die Utility-Klassen direkt im HTML-Markup zu verwenden.
- **Begründung**: Tailwind CSS fördert einen komponentenbasierten Ansatz, indem es das Styling direkt an das Markup bindet. Dies vermeidet das ständige Erfinden von semantischen Klassennamen und führt zu hochgradig konsistenten Benutzeroberflächen, die auf einem vordefinierten Design-System (Design Tokens) basieren. Die Integration in den Svelte/Vite-Build-Prozess ist nahtlos und die resultierenden CSS-Dateien sind durch Purging extrem klein, da nur die tatsächlich verwendeten Klassen im finalen Bundle enthalten sind.

Die auf den ersten Blick widersprüchlichen Ansätze von Sveltes Scoped Styles und Tailwinds Utility-First-Philosophie erzeugen in der Praxis eine leistungsstarke Synergie. Die optimale Strategie ist ein hybrider Ansatz, der das Beste aus beiden Welten vereint:

1. **Tailwind für das "Was" (Design System)**: Alle grundlegenden visuellen Aspekte – Farben, Abstände, Schriftgrößen, Flexbox/Grid-Layouts – werden direkt im Markup über Tailwind-Utility-Klassen definiert (z.B. `class="bg-primary text-foreground p-4 rounded-lg"`). Dies stellt die Einhaltung des globalen Design-Systems sicher.
2. **Scoped `<style>` für das "Wie" (Komponentenspezifische Logik)**: Komplexe Selektoren, die sich auf die interne Struktur oder den reaktiven Zustand einer Komponente beziehen, werden im `<style>`-Block definiert. Diese Stile sind logisch an die Komponente gebunden. Sie können CSS-Variablen verwenden, die vom Tailwind-Theme abgeleitet sind, oder in seltenen Fällen `@apply` nutzen, um die Konsistenz zu wahren (z.B. `button.active { @apply border-blue-500; }`).

Dieses Vorgehen ermöglicht die systematische Konsistenz von Tailwind und gleichzeitig die gekapselte, zustandsabhängige Styling-Power von Svelte. Das KI-System muss diese Unterscheidung lernen: Design-System-Tokens gehören als Klassen ins Markup; komplexe, logische oder strukturelle Stile gehören in den `<style>`-Block.

## 7. Code-Konventionen und Qualitätssicherung

Die folgenden Regeln sind nicht verhandelbar und dienen der Sicherstellung einer einheitlichen, hohen Code-Qualität im gesamten Projekt. Sie sind die Grundlage für eine effiziente Zusammenarbeit und eine automatisierte Code-Generierung und -Überprüfung.

### 7.1 Benennung (Naming Conventions)

Eine konsistente Benennung ist entscheidend für die Lesbarkeit und Vorhersehbarkeit des Codes.

- **Komponenten-Dateien**: MÜSSEN `PascalCase.svelte` verwenden (z.B. `DataGrid.svelte`). Dies ist eine Svelte-Konvention, da Komponenten im Markup als großgeschriebene Tags verwendet werden.
- **Variablen und Funktionen**: MÜSSEN `camelCase` verwenden (z.B. `const userData` oder `function fetchUserData()`).
- **TypeScript Typen & Interfaces**: MÜSSEN `PascalCase` verwenden (z.B. `interface UserProfile` oder `type UserId = string;`).
- **Andere Dateien**: Nicht-Komponenten-Dateien (z.B. Utilities, Stores) SOLLTEN projektweit konsistent entweder `camelCase.ts` (z.B. `dateUtils.ts`) oder `kebab-case.ts` (z.B. `date-utils.ts`) verwenden. Die gewählte Konvention ist im Projekt-README zu dokumentieren.

### 7.2 TypeScript

- **Regel: Obligatorische Verwendung**: Die Verwendung von TypeScript ist im gesamten Projekt verpflichtend. Der strict-Modus in der `tsconfig.json` MUSS aktiviert sein, um maximale Typsicherheit zu gewährleisten.
- **Regel: Verbot von any**: Die Verwendung des `any`-Typs ist strengstens verboten. Er untergräbt den gesamten Zweck von TypeScript. An Stellen, an denen ein Typ wirklich unbekannt ist, MUSS `unknown` verwendet werden, gefolgt von einer expliziten Typüberprüfung (Type Guard), bevor der Wert verwendet wird.
- **Best Practice**: `interface` ist für die Definition von Objektstrukturen gegenüber `type`-Aliassen zu bevorzugen, da Interfaces erweiterbar (`extends`) sind, was in komplexen Anwendungen oft von Vorteil ist. `type` eignet sich besser für die Definition von Primitiven, Unions oder Tupeln.

### 7.3 Linting & Formatting

- **Regel: Verbindliche Werkzeuge**: ESLint (für Code-Qualität und potenzielle Fehler) und Prettier (für Code-Formatierung) MÜSSEN im Projekt eingerichtet sein. Die Konfigurationsdateien (`eslint.config.js`, `.prettierrc`) sind Teil des Repositories, um Konsistenz über alle Entwicklungsumgebungen hinweg zu gewährleisten.
- **Regel: Automatisierung**: Es MUSS ein Pre-Commit-Hook (z.B. mittels `husky` und `lint-staged`) eingerichtet sein. Dieser Hook MUSS bei jedem `git commit`-Versuch automatisch `prettier --write` und `eslint --fix` auf alle geänderten Dateien ausführen. Commits mit verbleibenden Linting-Fehlern oder Formatierungsproblemen MÜSSEN abgewiesen werden.
- **Begründung**: Diese Automatisierung erzwingt einen einheitlichen Code-Stil, ohne dass Entwickler manuell darüber nachdenken müssen. Sie fängt häufige Fehler und "Code Smells" frühzeitig ab und sorgt dafür, dass die Codebasis sauber, lesbar und konsistent bleibt, was für die Zusammenarbeit und die Analyse durch KI-Systeme unerlässlich ist.

### 7.4 Testing

Eine umfassende Teststrategie ist entscheidend für die Stabilität und Wartbarkeit der Anwendung. Die folgende dreistufige Testpyramide ist verbindlich:

- **1. Unit-Tests (Vitest)**:
  - **Zweck**: Testen von isolierter Geschäftslogik, insbesondere reinen TypeScript/JavaScript-Funktionen in `/src/lib/utils/` und der Logik innerhalb von Svelte Stores.
  - **Regel**: Unit-Tests DÜRFEN keine UI rendern und keine externen Abhängigkeiten (wie Netzwerk oder Datenbank) haben. Diese müssen gemockt werden. Sie müssen extrem schnell sein, um eine sofortige Rückmeldung während der Entwicklung zu geben.

- **2. Component-Tests (Vitest + Svelte Testing Library)**:
  - **Zweck**: Testen einzelner Svelte-Komponenten in Isolation. Der Fokus liegt auf der Simulation von Benutzerinteraktionen und der Überprüfung des gerenderten Outputs.
  - **Regel**: Es wird getestet, was der Benutzer sieht und tun kann. Props werden gemockt, um die Komponente in verschiedenen Zuständen zu rendern. Interaktionen wie Klicks (`fireEvent.click`) und Eingaben werden simuliert, und das Ergebnis im DOM wird überprüft (z.B. `expect(screen.getByText('...')).toBeInTheDocument()`).

- **3. End-to-End-Tests (Playwright)**:
  - **Zweck**: Testen von kritischen, vollständigen Benutzerflüssen über mehrere Seiten und Komponenten hinweg.
  - **Regel**: E2E-Tests simulieren einen echten Benutzer in einem echten Browser. Sie interagieren mit der vollständig gerenderten Anwendung, einschließlich Frontend und Backend. Sie sind für die wichtigsten Geschäftsabläufe reserviert (z.B. der vollständige Registrierungs- und Anmeldeprozess, der Checkout-Prozess in einem E-Commerce-Shop).

## Anhang: Empfohlene Bibliotheken und Werkzeuge

Dieser Anhang dient als kuratierte und genehmigte Liste von Technologien. Die Auswahl einer Bibliothek, die nicht auf dieser Liste steht, erfordert einen formalen Genehmigungsprozess. Vor der Auswahl einer Bibliothek ist stets die Kompatibilität mit der aktuellen SvelteKit-Version zu prüfen und die jeweils neueste stabile Version der Bibliothek zu bevorzugen. Diese Liste bietet dem KI-System und den Entwicklern eine standardisierte Entscheidungsgrundlage, um technologische Wildwüchse zu vermeiden und die Konsistenz des Technologie-Stacks zu gewährleisten.

| Kategorie            | Bibliothek                 | Empfehlungsstufe | Schlüsselmerkmale & Begründung                                                                                                                                                                                                                               |
| -------------------- | -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **UI-Komponenten**   | **DaisyUI**                | Empfohlen        | Basiert auf Tailwind CSS, bietet semantische Klassennamen für fertige Komponenten (btn, card). Extrem leichtgewichtig (reines CSS) und schnell. Ideal für Prototyping und Projekte, bei denen Geschwindigkeit wichtiger ist als ein komplett eigenes Design. |
|                      | **Shadcn-Svelte**          | Genehmigt        | Portierung von shadcn/ui. Bietet ungestylte, aber hochgradig anpassbare und barrierefreie Komponenten. Man kopiert den Code per CLI ins Projekt und besitzt ihn. Perfekt für den Aufbau eigener, hochwertiger Design-Systeme mit voller Kontrolle.           |
|                      | **Melt UI**                | Genehmigt        | Eine "headless" UI-Bibliothek. Bietet nur die Logik, Zustandsverwaltung und Barrierefreiheit für komplexe UI-Muster (z.B. Dialog, Combobox), aber keinerlei Styling. Maximale Kontrolle für vollständig maßgeschneiderte Design-Systeme.                     |
| **BaaS / Datenbank** | **Supabase**               | Empfohlen        | Open-Source-Alternative zu Firebase. Bietet eine PostgreSQL-Datenbank, Authentifizierung, Storage und Realtime-Funktionen. Exzellente Integration mit SvelteKit durch offizielle Bibliotheken und eine starke Community.                                     |
|                      | **Appwrite**               | Genehmigt        | Eine weitere starke Open-Source-BaaS-Lösung. Fokussiert auf einfache Bedienung und Skalierbarkeit. Bietet eine umfassende Suite von Backend-Diensten, die sich gut in SvelteKit integrieren lassen.                                                          |
|                      | **Prisma**                 | Genehmigt        | Ein Next-Generation ORM für Node.js und TypeScript. Exzellent für die typsichere Arbeit mit traditionellen Datenbanken (PostgreSQL, MySQL, etc.) in einer SvelteKit-Anwendung. Bietet eine hervorragende Developer Experience.                               |
| **Formular-Mgmt.**   | **SvelteKit Form Actions** | Standard         | Die eingebaute Lösung. MUSS immer die erste Wahl sein, um das Prinzip des Progressive Enhancement zu gewährleisten. Bildet die Grundlage für alle anderen Formular-Bibliotheken in diesem Ökosystem.                                                         |
|                      | **Superforms**             | Empfohlen        | Baut auf Form Actions auf und erweitert sie massiv um client- und serverseitige Validierung (z.B. mit Zod), was zu einer stark verbesserten Developer Experience (DX) und deutlich weniger Boilerplate-Code führt.                                           |
|                      | **Felte**                  | Genehmigt        | Eine erweiterbare, primär client-seitige Bibliothek zur Formularverwaltung. Gut geeignet für hochdynamische, SPA-ähnliche Formulare, bei denen der reine Form-Actions-Ansatz an seine Grenzen stößt.                                                         |
| **International.**   | **Paraglide JS**           | Empfohlen        | Ein moderner, typsicherer und Compiler-optimierter Ansatz für i18n von inlang. Bietet Tree-Shaking für Übersetzungen (nur genutzte Texte landen im Bundle) und eine hervorragende, typsichere DX.                                                            |
|                      | **svelte-i18n**            | Genehmigt        | Eine etablierte und ausgereifte Bibliothek für die Übersetzung von Svelte-Anwendungen. Eine solide und bewährte Wahl, insbesondere für bestehende Projekte oder wenn ICU-Message-Formatierung benötigt wird.                                                 |
| **Visualisierung**   | **LayerCake**              | Empfohlen        | Ein Framework, um flexible und wiederverwendbare Grafiken zu erstellen. Nutzt einen Svelte-nativen Ansatz und erlaubt es, Diagramme schichtweise aus wiederverwendbaren Komponenten aufzubauen. Sehr gut für SSR geeignet.                                   |
|                      | **D3.js**                  | Genehmigt        | Der Goldstandard für komplexe, datengesteuerte und interaktive Visualisierungen. Kann direkt in Svelte integriert werden, erfordert aber sorgfältige Handhabung des DOM (onMount, bind:this), um Konflikte mit Sveltes Reaktivität zu vermeiden.             |
