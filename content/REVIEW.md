# Content review and playtest notes

## Editorial review completed in this implementation

- Confirmed exactly 500 sequential IDs, four distinct choices each and 100 extreme questions at 401–500.
- Reviewed the 94 incident evidence/cause/repair chains for consistency and scope. Replaced cross-incident alternatives with 94 incident-specific sets of competing diagnoses and unsafe or insufficient repairs.
- Investigation alternatives test competing hypotheses; verification and prevention alternatives deliberately test whether an action alone establishes recovery or prevents recurrence. These transformed choices are a first editorial pass, not independently calibrated distractors.
- Corrected ambiguous ECR token timing to explicitly exceed twelve hours; the official ECR authentication documentation states the token lifetime.
- Renamed the Trivy case to describe gate enforcement rather than an unrelated signature concept.
- Retained distinctions between authentication and authorization, desired state and live state, readiness and real user health, image rollback and schema rollback, and DNS routing and writer fencing.
- Added wrong-answer explanations to the 470 later encounters and official documentation links for further reading.

## Primary references used for technical spot checks

- ECR registry authentication: https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html
- GitHub OIDC: https://docs.github.com/en/actions/concepts/security/openid-connect
- Terraform state locking: https://developer.hashicorp.com/terraform/language/state/locking
- Argo CD self-healing: https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/
- Kubernetes network policy transports: https://kubernetes.io/docs/concepts/services-networking/network-policies/

Additional tool references are embedded in the campaign. This review was performed during implementation; it is not an independent expert audit or certification of every operational recommendation. Real environments require their own diagnosis, permissions and recovery procedures.

## Ready for player feedback

The game offers a Feedback form with difficulty categories and a free-text note. It previews a report containing the completed count, current question number, rating and note. No report is transmitted automatically. Players may open the prepared GitHub issue and choose to submit it there.

No external player feedback has been collected or invented. Use reports to improve ambiguous options and calibrate difficulty; a level number does not certify professional seniority.
