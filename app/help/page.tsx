export default function HelpPage() {
  return (
    <div className="card stack">
      <h1 style={{ margin: 0 }}>Mode d&apos;emploi</h1>
      <p className="muted small">
        Cette page explique les étapes clés pour créer un contrat, comprendre les règles de calcul,
        et gérer un contrat actif au quotidien.
      </p>

      <section className="card stack">
        <strong>1) Créer un contrat : ce qui est obligatoire</strong>
        <ul>
          <li><strong>Enfant</strong>, <strong>date de début</strong> et <strong>type</strong> (CDI ou CDD) sont indispensables.</li>
          <li><strong>Heures/jour</strong>, <strong>jours/semaine</strong> et <strong>semaines/an</strong> définissent la base mensualisée.</li>
          <li><strong>Taux de base</strong> : mettez 0 pour utiliser la grille auto, ou un montant pour forcer un taux.</li>
          <li><strong>Absences prévues</strong> : utilisez les champs de dates puis ajoutez-les au tableau (plus besoin de JSON).</li>
        </ul>
      </section>

      <section className="card stack">
        <strong>2) Comprendre les règles du contrat</strong>
        <ul>
          <li><strong>Heures complémentaires</strong> : activables/désactivables selon votre mode de facturation.</li>
          <li><strong>Majoration</strong> : le pourcentage s&apos;applique aux heures dépassant le seuil hebdomadaire.</li>
          <li><strong>Repas et entretien</strong> : chaque indemnité est indépendante et peut être activée séparément.</li>
          <li><strong>Prime de précarité</strong> : à activer pour les CDD si nécessaire.</li>
        </ul>
      </section>

      <section className="card stack">
        <strong>3) Gérer un contrat actif</strong>
        <ul>
          <li><strong>Pointages</strong> : renseignez date, arrivée, départ, repas et notes, puis enregistrez.</li>
          <li><strong>Tags journaliers</strong> : absence prévue, absence non prévue, jour férié et indisponibilité.</li>
          <li><strong>Vues disponibles</strong> :
            <ul>
              <li><strong>Jour</strong> pour le détail ligne par ligne.</li>
              <li><strong>Semaine</strong> pour le cumul d&apos;heures et majorations.</li>
              <li><strong>Mois</strong> pour la synthèse paie/facturation.</li>
            </ul>
          </li>
          <li><strong>Indisponibilités</strong> : préparez-les dans le contrat via le tableau d&apos;absences prévues, puis marquez un jour en indisponible si besoin dans les pointages.</li>
        </ul>
      </section>
    </div>
  );
}
