/**
 * Unit Tests for PrivacyCompliantTelemetry
 *
 * Tests HIPAA/GDPR compliance, PII scrubbing, consent management,
 * and data anonymization.
 *
 * @gate Gate 5 - Telemetry
 */

import PrivacyCompliantTelemetry, {
  DEFAULT_PRIVACY_CONFIG,
  ConsentStatus,
} from '../PrivacyCompliantTelemetry';

describe('PrivacyCompliantTelemetry', () => {
  let privacy: PrivacyCompliantTelemetry;

  beforeEach(() => {
    privacy = new PrivacyCompliantTelemetry();
  });

  // ========================================================================
  // Consent Management
  // ========================================================================

  describe('Consent management', () => {
    it('should default to no consent', () => {
      const consent = privacy.getConsent();
      expect(consent).toBeNull();
    });

    it('should store user consent', () => {
      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: true,
        performanceConsent: false,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };

      privacy.setConsent(consent);

      expect(privacy.getConsent()).toEqual(consent);
    });

    it('should check telemetry permission', () => {
      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: false,
        performanceConsent: false,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };

      privacy.setConsent(consent);

      expect(privacy.isAllowed('telemetry')).toBe(true);
      expect(privacy.isAllowed('crash')).toBe(false);
      expect(privacy.isAllowed('performance')).toBe(false);
    });

    it('should deny all events without consent', () => {
      expect(privacy.isAllowed('telemetry')).toBe(false);
      expect(privacy.isAllowed('crash')).toBe(false);
      expect(privacy.isAllowed('performance')).toBe(false);
    });
  });

  // ========================================================================
  // PII Scrubbing
  // ========================================================================

  describe('PII scrubbing', () => {
    it('should scrub email addresses', () => {
      const event = {
        type: 'test',
        data: {
          message: 'Contact user@example.com for support',
          email: 'admin@test.com',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.message).toContain('[EMAIL_REDACTED]');
      expect(scrubbed.data.message).not.toContain('user@example.com');
      expect(scrubbed.data.email).toContain('[EMAIL_REDACTED]');
    });

    it('should scrub phone numbers', () => {
      const event = {
        type: 'test',
        data: {
          contact: 'Call 555-123-4567 or 5551234567',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.contact).toContain('[PHONE_REDACTED]');
      expect(scrubbed.data.contact).not.toContain('555-123-4567');
    });

    it('should scrub SSNs', () => {
      const event = {
        type: 'test',
        data: {
          text: 'SSN: 123-45-6789',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.text).toContain('[SSN_REDACTED]');
      expect(scrubbed.data.text).not.toContain('123-45-6789');
    });

    it('should scrub IP addresses', () => {
      const event = {
        type: 'test',
        data: {
          server: 'Connected to 192.168.1.100',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.server).toContain('[IP_REDACTED]');
      expect(scrubbed.data.server).not.toContain('192.168.1.100');
    });

    it('should scrub names (basic pattern)', () => {
      const event = {
        type: 'test',
        data: {
          therapist: 'Assigned to John Smith',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.therapist).toContain('[NAME_REDACTED]');
      expect(scrubbed.data.therapist).not.toContain('John Smith');
    });

    it('should scrub nested objects', () => {
      const event = {
        type: 'test',
        data: {
          user: {
            profile: {
              email: 'user@test.com',
              phone: '555-123-4567',
            },
          },
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.user.profile.email).toContain('[EMAIL_REDACTED]');
      expect(scrubbed.data.user.profile.phone).toContain('[PHONE_REDACTED]');
    });

    it('should scrub arrays', () => {
      const event = {
        type: 'test',
        data: {
          emails: ['user1@test.com', 'user2@test.com'],
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.emails[0]).toContain('[EMAIL_REDACTED]');
      expect(scrubbed.data.emails[1]).toContain('[EMAIL_REDACTED]');
    });

    it('should track scrubbed fields', () => {
      const event = {
        type: 'test',
        data: {
          email: 'test@example.com',
          nested: {
            phone: '555-1234',
          },
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.privacy.scrubbedFields.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // Device ID Scrubbing
  // ========================================================================

  describe('Device ID scrubbing', () => {
    it('should scrub device IDs when enabled', () => {
      privacy = new PrivacyCompliantTelemetry({ scrubDeviceIds: true });

      const event = {
        type: 'test',
        data: {
          deviceId: 'ABC-123-XYZ',
          udid: 'DEVICE-UDID',
          advertisingId: 'AD-ID-123',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.deviceId).toBe('[REDACTED]');
      expect(scrubbed.data.udid).toBe('[REDACTED]');
      expect(scrubbed.data.advertisingId).toBe('[REDACTED]');
    });

    it('should not scrub device IDs when disabled', () => {
      privacy = new PrivacyCompliantTelemetry({ scrubDeviceIds: false });

      const event = {
        type: 'test',
        data: {
          deviceId: 'ABC-123-XYZ',
        },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.data.deviceId).toBe('ABC-123-XYZ');
    });
  });

  // ========================================================================
  // User Anonymization
  // ========================================================================

  describe('User anonymization', () => {
    it('should anonymize user ID when enabled', () => {
      privacy = new PrivacyCompliantTelemetry({ anonymizeUsers: true });

      const event = {
        type: 'test',
        userId: 'user-12345',
        data: { test: 'data' },
      };

      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.anonymousUserId).toBeTruthy();
      expect(scrubbed.anonymousUserId).not.toBe('user-12345');
    });

    it('should produce consistent hashes for same user ID', () => {
      privacy = new PrivacyCompliantTelemetry({ anonymizeUsers: true });

      const event1 = { type: 'test', userId: 'user-123', data: {} };
      const event2 = { type: 'test', userId: 'user-123', data: {} };

      const scrubbed1 = privacy.scrubEvent(event1);
      const scrubbed2 = privacy.scrubEvent(event2);

      expect(scrubbed1.anonymousUserId).toBe(scrubbed2.anonymousUserId);
    });

    it('should produce different hashes for different user IDs', () => {
      privacy = new PrivacyCompliantTelemetry({ anonymizeUsers: true });

      const event1 = { type: 'test', userId: 'user-123', data: {} };
      const event2 = { type: 'test', userId: 'user-456', data: {} };

      const scrubbed1 = privacy.scrubEvent(event1);
      const scrubbed2 = privacy.scrubEvent(event2);

      expect(scrubbed1.anonymousUserId).not.toBe(scrubbed2.anonymousUserId);
    });
  });

  // ========================================================================
  // Event Validation
  // ========================================================================

  describe('Event validation', () => {
    it('should reject events without consent', () => {
      const event = { type: 'test', data: {} };
      const isValid = privacy.validateEvent(event, 'telemetry');

      expect(isValid).toBe(false);
    });

    it('should accept events with consent', () => {
      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: true,
        performanceConsent: true,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };

      privacy.setConsent(consent);

      const event = { type: 'test', data: {} };
      const isValid = privacy.validateEvent(event, 'telemetry');

      expect(isValid).toBe(true);
    });

    it('should reject invalid events', () => {
      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: true,
        performanceConsent: true,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };

      privacy.setConsent(consent);

      const isValid1 = privacy.validateEvent(null, 'telemetry');
      const isValid2 = privacy.validateEvent('invalid', 'telemetry');

      expect(isValid1).toBe(false);
      expect(isValid2).toBe(false);
    });
  });

  // ========================================================================
  // Compliance Reporting
  // ========================================================================

  describe('Compliance reporting', () => {
    it('should report HIPAA compliance status', () => {
      privacy = new PrivacyCompliantTelemetry({
        anonymizeUsers: true,
        scrubDeviceIds: true,
        retentionDays: 90,
      });

      const report = privacy.getPrivacyReport();

      expect(report.compliance.hipaa).toBe(true);
    });

    it('should fail HIPAA compliance with long retention', () => {
      privacy = new PrivacyCompliantTelemetry({
        anonymizeUsers: true,
        scrubDeviceIds: true,
        retentionDays: 365, // > 180 days
      });

      const report = privacy.getPrivacyReport();

      expect(report.compliance.hipaa).toBe(false);
    });

    it('should report GDPR compliance with consent', () => {
      privacy = new PrivacyCompliantTelemetry({ anonymizeUsers: true });

      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: false,
        performanceConsent: false,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };

      privacy.setConsent(consent);

      const report = privacy.getPrivacyReport();

      expect(report.compliance.gdpr).toBe(true);
    });

    it('should fail GDPR compliance without anonymization', () => {
      privacy = new PrivacyCompliantTelemetry({ anonymizeUsers: false });

      const report = privacy.getPrivacyReport();

      expect(report.compliance.gdpr).toBe(false);
    });
  });

  // ========================================================================
  // GDPR Rights
  // ========================================================================

  describe('GDPR rights', () => {
    it('should export user data (Right of Access)', () => {
      const exportData = privacy.exportUserData('user-123');

      expect(exportData.userId).toBe('user-123');
      expect(exportData.anonymousId).toBeTruthy();
      expect(exportData.dataRetained).toBeTruthy();
    });

    it('should request data deletion (Right to Erasure)', () => {
      const deletion = privacy.requestDataDeletion('user-123');

      expect(deletion.userId).toBe('user-123');
      expect(deletion.anonymousId).toBeTruthy();
      expect(deletion.deletionRequested).toBeLessThanOrEqual(Date.now());
      expect(deletion.deletionScheduled).toBeGreaterThan(deletion.deletionRequested);
    });
  });

  // ========================================================================
  // Default Configuration
  // ========================================================================

  describe('Default configuration', () => {
    it('should use secure defaults', () => {
      expect(DEFAULT_PRIVACY_CONFIG.enabled).toBe(false); // Opt-in
      expect(DEFAULT_PRIVACY_CONFIG.anonymizeUsers).toBe(true);
      expect(DEFAULT_PRIVACY_CONFIG.scrubDeviceIds).toBe(true);
      expect(DEFAULT_PRIVACY_CONFIG.aggregateBeforeSend).toBe(true);
      expect(DEFAULT_PRIVACY_CONFIG.retentionDays).toBe(90); // HIPAA minimum
    });

    it('should allow configuration override', () => {
      privacy = new PrivacyCompliantTelemetry({
        enabled: true,
        retentionDays: 30,
      });

      const report = privacy.getPrivacyReport();

      expect(report.config.enabled).toBe(true);
      expect(report.config.retentionDays).toBe(30);
      expect(report.config.anonymizeUsers).toBe(true); // Default preserved
    });
  });

  // ========================================================================
  // Integration Scenarios
  // ========================================================================

  describe('Integration scenarios', () => {
    it('should handle complete telemetry flow', () => {
      // 1. Initialize with HIPAA compliance
      privacy = new PrivacyCompliantTelemetry({
        enabled: false,
        anonymizeUsers: true,
        scrubDeviceIds: true,
        retentionDays: 90,
      });

      // 2. User provides consent
      const consent: ConsentStatus = {
        telemetryConsent: true,
        crashReportConsent: true,
        performanceConsent: true,
        consentDate: Date.now(),
        consentVersion: '1.0.0',
      };
      privacy.setConsent(consent);

      // 3. Validate event
      const event = {
        type: 'session_complete',
        userId: 'user-789',
        data: {
          deviceId: 'DEVICE-123',
          therapistEmail: 'therapist@clinic.com',
          patientName: 'John Doe',
          performance: { latency: 50 },
        },
      };

      const isValid = privacy.validateEvent(event, 'telemetry');
      expect(isValid).toBe(true);

      // 4. Scrub event
      const scrubbed = privacy.scrubEvent(event);

      expect(scrubbed.anonymousUserId).toBeTruthy();
      expect(scrubbed.anonymousUserId).not.toBe('user-789');
      expect(scrubbed.data.deviceId).toBe('[REDACTED]');
      expect(scrubbed.data.therapistEmail).toContain('[EMAIL_REDACTED]');
      expect(scrubbed.data.patientName).toContain('[NAME_REDACTED]');
      expect(scrubbed.data.performance.latency).toBe(50); // Non-PII preserved

      // 5. Verify compliance
      const report = privacy.getPrivacyReport();
      expect(report.compliance.hipaa).toBe(true);
      expect(report.compliance.gdpr).toBe(true);
    });
  });
});
