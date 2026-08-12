import React from 'react';
import toast from 'react-hot-toast';

/**
 * Service d'envoi d'e-mails officiels et de notifications ciblées SyLOC-T
 * (CROUS de Thiès / Site VCN)
 */

export const emailService = {
  /**
   * Envoie un e-mail officiel à un destinataire
   */
  sendEmail: async ({ to, subject, body, templateType = 'INFO' }) => {
    const emailLog = {
      id: 'MAIL-' + Date.now(),
      to,
      subject,
      body,
      templateType,
      date: new Date().toLocaleString('fr-FR'),
      status: 'ENVOYE',
    };

    // Sauvegarder dans le journal des emails envoyés
    try {
      const history = JSON.parse(localStorage.getItem('syloct_email_history') || '[]');
      history.unshift(emailLog);
      localStorage.setItem('syloct_email_history', JSON.stringify(history));
    } catch (e) {
      console.warn("Erreur de sauvegarde de l'historique des emails:", e);
    }

    console.log(`✉️ [EMAIL SyLOC-T] Destinataire: ${to} | Sujet: ${subject}`);
    
    // Simulation visuelle de l'email
    toast(
      (t) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
            <span style={{ fontSize: 18 }}>📧</span> Email Simulée Envoyé
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            <strong>À :</strong> {to}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            <strong>Sujet :</strong> {subject}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{ 
              marginTop: 8, padding: '4px 8px', background: 'var(--surface-2)', 
              border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 11 
            }}
          >
            Fermer
          </button>
        </div>
      ),
      { duration: 5000, position: 'bottom-right' }
    );

    return { success: true, log: emailLog };
  },

  /**
   * Génère et envoie une notification de demande de complément au candidat
   */
  sendComplementRequest: async (candidatEmail, dossierRef, piecesManquantes) => {
    return emailService.sendEmail({
      to: candidatEmail,
      subject: `[CROUS-T / Bureau du Courrier] Demande de complément de pièces pour le dossier ${dossierRef}`,
      body: `Bonjour,\n\nLe Bureau du Courrier a examiné votre dossier ${dossierRef}. Veuillez transmettre les pièces complémentaires suivantes sous 10 jours :\n- ${piecesManquantes.join('\n- ')}\n\nCordialement,\nBureau du Courrier - CROUS de Thiès`,
      templateType: 'COMPLEMENT_REQUIS',
    });
  },

  /**
   * Notification par e-mail d'un avis de convocation ou sanction
   */
  sendSanctionNotice: async (occupantEmail, motif, type = 'AVERTISSEMENT') => {
    return emailService.sendEmail({
      to: occupantEmail,
      subject: `[CROUS-T / Service Juridique] Notification officielle : ${type}`,
      body: `Madame, Monsieur,\n\nVous faites l'objet d'une notification officielle pour le motif suivant :\n"${motif}".\n\nMerci de vous présenter au Service Juridique ou de régulariser la situation dans les plus brefs délais.\n\nService Juridique - CROUS-T`,
      templateType: 'SANCTION',
    });
  },

  /**
   * Notification d'un nouvel appel à candidature aux usagers enregistrés
   */
  sendAppelCandidatureNotice: async (recipientsEmails, appelTitre) => {
    const promises = recipientsEmails.map(email => 
      emailService.sendEmail({
        to: email,
        subject: `📢 [CROUS-T] Nouvel Appel à Candidature : ${appelTitre}`,
        body: `Un nouvel appel à candidature commercial a été publié sur la plateforme SyLOC-T : "${appelTitre}". Connectez-vous à votre espace personnel pour postuler.`,
        templateType: 'APPEL_CANDIDATURE',
      })
    );
    return Promise.all(promises);
  }
};
