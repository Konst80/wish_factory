<script lang="ts">
	let { isOpen = $bindable(false) } = $props();

	function closeModal() {
		isOpen = false;
	}
</script>

{#if isOpen}
	<div class="modal modal-open">
		<div class="modal-box w-11/12 max-w-4xl">
			<h3 class="mb-4 text-lg font-bold">🔄 Wunsch-Workflow & Prozessbeschreibung</h3>

			<div class="space-y-6">
				<!-- Workflow Overview -->
				<div class="alert alert-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<h4 class="font-bold">Gesamtprozess:</h4>
						<p>
							Wünsche durchlaufen einen strukturierten Workflow von der Erstellung bis zur
							Veröffentlichung in WishSnap.
						</p>
					</div>
				</div>

				<!-- Workflow Steps -->
				<div class="space-y-4">
					<h4 class="border-base-300 border-b pb-2 text-lg font-semibold">📋 Workflow-Schritte</h4>

					<!-- Step 1: Entwurf -->
					<div class="card bg-base-100 border-warning/20 border">
						<div class="card-body">
							<div class="mb-2 flex items-center gap-3">
								<div class="badge badge-warning">1</div>
								<h5 class="text-warning font-bold">📝 Entwurf</h5>
							</div>
							<p class="mb-3 text-sm">
								<strong>Zweck:</strong> Erstellung und Bearbeitung von Wünschen
							</p>
							<div class="space-y-1 text-sm">
								<p><strong>Berechtigung:</strong> Redakteure & Administratoren</p>
								<p><strong>Aktionen:</strong> Erstellen, Bearbeiten, Löschen</p>
								<p><strong>Nächster Schritt:</strong> → Zur Freigabe oder → Archiviert</p>
								<p>
									<strong>Beschreibung:</strong> Hier werden neue Wünsche geschrieben und bestehende
									überarbeitet. Der Inhalt kann beliebig oft geändert werden.
								</p>
							</div>
						</div>
					</div>

					<!-- Step 2: Zur Freigabe -->
					<div class="card bg-base-100 border-info/20 border">
						<div class="card-body">
							<div class="mb-2 flex items-center gap-3">
								<div class="badge badge-info">2</div>
								<h5 class="text-info font-bold">⏳ Zur Freigabe</h5>
							</div>
							<p class="mb-3 text-sm"><strong>Zweck:</strong> Qualitätsprüfung und Genehmigung</p>
							<div class="space-y-1 text-sm">
								<p>
									<strong>Berechtigung:</strong> Redakteure können einreichen, Administratoren genehmigen
								</p>
								<p><strong>Aktionen:</strong> Prüfung auf Qualität, Grammatik, Angemessenheit</p>
								<p>
									<strong>Nächster Schritt:</strong> → Freigegeben, → Entwurf (zurück) oder → Archiviert
								</p>
								<p>
									<strong>Beschreibung:</strong> Administratoren prüfen eingereichte Wünsche und entscheiden
									über deren Freigabe.
								</p>
							</div>
						</div>
					</div>

					<!-- Step 3: Freigegeben -->
					<div class="card bg-base-100 border-success/20 border">
						<div class="card-body">
							<div class="mb-2 flex items-center gap-3">
								<div class="badge badge-success">3</div>
								<h5 class="text-success font-bold">✅ Freigegeben</h5>
							</div>
							<p class="mb-3 text-sm">
								<strong>Zweck:</strong> Qualitätsgeprüfte Wünsche bereit für Release
							</p>
							<div class="space-y-1 text-sm">
								<p><strong>Berechtigung:</strong> Nur Administratoren können freigeben</p>
								<p><strong>Aktionen:</strong> Release für WishSnap möglich</p>
								<p><strong>Nächster Schritt:</strong> → Released (WishSnap) oder → Archiviert</p>
								<p>
									<strong>Beschreibung:</strong> Freigegebene Wünsche sind qualitätsgeprüft und können
									für die öffentliche WishSnap-App released werden.
								</p>
							</div>
						</div>
					</div>

					<!-- Step 4: Released -->
					<div class="card bg-base-100 border-accent/20 border">
						<div class="card-body">
							<div class="mb-2 flex items-center gap-3">
								<div class="badge badge-accent">4</div>
								<h5 class="text-accent font-bold">🚀 Released</h5>
							</div>
							<p class="mb-3 text-sm">
								<strong>Zweck:</strong> Öffentliche Verfügbarkeit in WishSnap-App
							</p>
							<div class="space-y-1 text-sm">
								<p><strong>Berechtigung:</strong> Administratoren & Redakteure können releasen</p>
								<p>
									<strong>Aktionen:</strong> Snapshot in separate Tabelle, öffentlicher API-Zugriff
								</p>
								<p>
									<strong>API:</strong> Verfügbar über /api/public/wishes (ohne Authentifizierung)
								</p>
								<p>
									<strong>Beschreibung:</strong> Released Wishes sind öffentlich verfügbar und können
									von der WishSnap-App heruntergeladen werden.
								</p>
							</div>
						</div>
					</div>

					<!-- Step 5: Archiviert -->
					<div class="card bg-base-100 border-neutral/20 border">
						<div class="card-body">
							<div class="mb-2 flex items-center gap-3">
								<div class="badge badge-ghost">A</div>
								<h5 class="text-neutral font-bold">📁 Archiviert</h5>
							</div>
							<p class="mb-3 text-sm"><strong>Zweck:</strong> Inaktivierung ohne Löschung</p>
							<div class="space-y-1 text-sm">
								<p><strong>Berechtigung:</strong> Nur Administratoren</p>
								<p><strong>Aktionen:</strong> Reaktivierung möglich (→ Entwurf)</p>
								<p>
									<strong>Verwendung:</strong> Qualitätskontrolle, veraltete/ungeeignete Inhalte
								</p>
								<p>
									<strong>Beschreibung:</strong> Archivierte Wünsche sind inaktiv, aber nicht gelöscht.
									Sie können reaktiviert werden.
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Roles & Permissions -->
				<div class="space-y-4">
					<h4 class="border-base-300 border-b pb-2 text-lg font-semibold">
						👥 Rollen & Berechtigungen
					</h4>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<!-- Redakteur -->
						<div class="card bg-primary/5 border-primary/20 border">
							<div class="card-body">
								<h5 class="text-primary flex items-center gap-2 font-bold">
									<span class="badge badge-primary badge-xs">Redakteur</span>
									Standard-Benutzer
								</h5>
								<ul class="mt-2 space-y-1 text-sm">
									<li>✅ Wünsche erstellen (Entwurf)</li>
									<li>✅ Eigene Wünsche bearbeiten</li>
									<li>✅ Zur Freigabe einreichen</li>
									<li>✅ Wünsche für WishSnap releasen</li>
									<li>❌ Wünsche freigeben</li>
									<li>❌ Wünsche archivieren</li>
									<li>❌ Fremde Entwürfe bearbeiten</li>
								</ul>
							</div>
						</div>

						<!-- Administrator -->
						<div class="card bg-error/5 border-error/20 border">
							<div class="card-body">
								<h5 class="text-error flex items-center gap-2 font-bold">
									<span class="badge badge-error badge-xs">Administrator</span>
									Vollzugriff
								</h5>
								<ul class="mt-2 space-y-1 text-sm">
									<li>✅ Alle Redakteur-Rechte</li>
									<li>✅ Wünsche freigeben/ablehnen</li>
									<li>✅ Wünsche archivieren</li>
									<li>✅ Archivierte reaktivieren</li>
									<li>✅ Alle Wünsche bearbeiten</li>
									<li>✅ Benutzer verwalten</li>
									<li>✅ System-Einstellungen</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				<!-- WishSnap Integration -->
				<div class="space-y-4">
					<h4 class="border-base-300 border-b pb-2 text-lg font-semibold">
						📱 WishSnap Integration
					</h4>

					<div class="alert alert-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="h-6 w-6 shrink-0 stroke-current"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						<div class="text-sm">
							<h5 class="font-bold">Öffentliche API:</h5>
							<p><strong>Endpoint:</strong> /api/public/wishes</p>
							<p><strong>Zugriff:</strong> Ohne Authentifizierung (öffentlich)</p>
							<p><strong>Inhalt:</strong> Nur released Wishes (Snapshot-Daten)</p>
							<p><strong>Verwendung:</strong> WishSnap-App lädt Wünsche für Offline-Nutzung</p>
						</div>
					</div>
				</div>

				<!-- Best Practices -->
				<div class="space-y-4">
					<h4 class="border-base-300 border-b pb-2 text-lg font-semibold">💡 Best Practices</h4>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<h5 class="text-success mb-2 font-semibold">✅ Empfohlenes Vorgehen:</h5>
							<ul class="space-y-1 text-sm">
								<li>• Wünsche in Entwurf sorgfältig prüfen</li>
								<li>• Klare, verständliche Sprache verwenden</li>
								<li>• Platzhalter korrekt einsetzen</li>
								<li>• Angemessene Kategorisierung</li>
								<li>• Release nur nach Qualitätsprüfung</li>
							</ul>
						</div>
						<div>
							<h5 class="text-error mb-2 font-semibold">❌ Zu vermeiden:</h5>
							<ul class="space-y-1 text-sm">
								<li>• Rechtschreibfehler in freigegebenen Wünschen</li>
								<li>• Unpassende/verletzende Inhalte</li>
								<li>• Zu generische oder zu spezifische Wünsche</li>
								<li>• Release ohne ausreichende Prüfung</li>
								<li>• Häufige Status-Wechsel</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			<div class="modal-action">
				<button class="btn btn-primary" onclick={closeModal}>Verstanden</button>
			</div>
		</div>
	</div>
{/if}
