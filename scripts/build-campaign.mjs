import fs from 'node:fs';
const file=new URL('../content/incidents.tsv',import.meta.url);
const rows=fs.readFileSync(file,'utf8').trim().split('\n').filter(line=>line&&!line.startsWith('#'));
const phases=[
 {name:'Diagnose',field:3,ask:'Which diagnosis best accounts for the recorded evidence?',hint:'Match the cause to the specific failure, rather than guessing from the tool name.'},
 {name:'Investigate',field:4,ask:'Which investigation most directly checks that diagnosis?',hint:'Choose evidence that can confirm or reject the suspected failure mechanism.'},
 {name:'Repair',field:5,ask:'Which repair most directly addresses this incident while controlling impact?',hint:'Target the established cause and preserve access, data and serving capacity.'},
 {name:'Verify',field:6,ask:'Which verification best establishes that this incident is resolved?',hint:'Verify the original failure path, not just a successful command exit.'},
 {name:'Prevent',field:7,ask:'Which prevention measure most directly reduces recurrence of this incident?',hint:'Address the failure mechanism with a repeatable engineering control.'}
];
if(rows.length!==94)throw Error(`Expected 94 incident cases, got ${rows.length}`);
const cases=rows.map((line,i)=>{const fields=line.split('|');if(fields.length!==8||fields.some(f=>!f.trim()))throw Error(`Malformed case ${i+1}`);return fields;});
const refs={
 'Bash':'https://www.gnu.org/software/bash/manual/bash.html', 'Python':'https://docs.python.org/3/library/venv.html',
 'GitHub':'https://docs.github.com/en/actions', 'Nginx':'https://nginx.org/en/docs/', 'Apache HTTP Server':'https://httpd.apache.org/docs/2.4/',
 'HAProxy':'https://docs.haproxy.org/', 'DNS':'https://www.rfc-editor.org/rfc/rfc1034', 'TLS':'https://www.rfc-editor.org/rfc/rfc8446',
 'systemd':'https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html', 'Docker Compose':'https://docs.docker.com/compose/how-tos/networking/',
 'Podman':'https://docs.podman.io/en/latest/markdown/podman-run.1.html', 'BuildKit':'https://docs.docker.com/build/',
 'Amazon ECR':'https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html', 'GitHub Container Registry':'https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry',
 'Jenkins':'https://www.jenkins.io/doc/book/pipeline/', 'GitHub Actions':'https://docs.github.com/en/actions/concepts/security/openid-connect',
 'GitLab CI':'https://docs.gitlab.com/ci/variables/', 'Azure DevOps':'https://learn.microsoft.com/en-us/azure/devops/pipelines/process/approvals',
 'CircleCI':'https://circleci.com/docs/contexts/', 'Maven':'https://maven.apache.org/plugins/maven-compiler-plugin/', 'Gradle':'https://docs.gradle.org/current/userguide/gradle_wrapper.html',
 'npm':'https://docs.npmjs.com/cli/commands/npm-ci', 'Nexus Repository':'https://help.sonatype.com/en/sonatype-nexus-repository.html',
 'JFrog Artifactory':'https://jfrog.com/help/r/jfrog-platform-administration-documentation/permissions', 'Terraform':'https://developer.hashicorp.com/terraform/language/state/locking',
 'OpenTofu':'https://opentofu.org/docs/cli/workspaces/', 'AWS CloudFormation':'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-exports.html',
 'Pulumi':'https://www.pulumi.com/docs/iac/concepts/state-and-backends/', 'Ansible':'https://docs.ansible.com/ansible/latest/collections/ansible/builtin/lineinfile_module.html',
 'Packer':'https://developer.hashicorp.com/packer/docs', 'AWS IAM':'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html',
 'Amazon EC2':'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html', 'Amazon VPC':'https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html',
 'AWS ALB':'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html', 'AWS Auto Scaling':'https://docs.aws.amazon.com/autoscaling/ec2/userguide/asg-capacity-limits.html',
 'Amazon S3':'https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html', 'Amazon RDS':'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithParamGroups.html',
 'Amazon Route 53':'https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html', 'AWS Lambda':'https://docs.aws.amazon.com/lambda/latest/dg/configuration-concurrency.html',
 'Amazon CloudWatch':'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html', 'Amazon EKS':'https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html',
 'Azure AKS':'https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration', 'Azure Key Vault':'https://learn.microsoft.com/en-us/azure/key-vault/general/rbac-guide',
 'Azure Monitor':'https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/data-collection-rule-overview', 'Google GKE':'https://cloud.google.com/kubernetes-engine/docs/concepts/workload-identity',
 'Google Artifact Registry':'https://cloud.google.com/artifact-registry/docs/docker/names', 'Kubernetes':'https://kubernetes.io/docs/tasks/debug/debug-application/',
 'Helm':'https://helm.sh/docs/chart_template_guide/values_files/', 'Argo CD':'https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/',
 'Flux':'https://fluxcd.io/flux/components/kustomize/kustomizations/', 'Kustomize':'https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/',
 'Prometheus':'https://prometheus.io/docs/prometheus/latest/configuration/configuration/', 'Grafana':'https://grafana.com/docs/grafana/latest/dashboards/',
 'Alertmanager':'https://prometheus.io/docs/alerting/latest/alertmanager/', 'Grafana Loki':'https://grafana.com/docs/loki/latest/get-started/labels/cardinality/',
 'Elasticsearch':'https://www.elastic.co/docs/troubleshoot/elasticsearch/red-yellow-cluster-status', 'Logstash':'https://www.elastic.co/docs/reference/logstash/plugins/plugins-filters-grok',
 'OpenTelemetry':'https://opentelemetry.io/docs/collector/resiliency/', 'Jaeger':'https://www.jaegertracing.io/docs/latest/architecture/',
 'Trivy':'https://trivy.dev/latest/docs/configuration/reporting/', 'SonarQube':'https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/ci-integration/overview',
 'Snyk':'https://docs.snyk.io/snyk-cli/commands/test', 'Gitleaks':'https://github.com/gitleaks/gitleaks', 'Semgrep':'https://semgrep.dev/docs/ignoring-files-folders-code',
 'HashiCorp Vault':'https://developer.hashicorp.com/vault/docs/concepts/lease', 'OPA Gatekeeper':'https://open-policy-agent.github.io/gatekeeper/website/docs/',
 'Kyverno':'https://kyverno.io/docs/policy-types/cluster-policy/verify-images/', 'Falco':'https://falco.org/docs/', 'Redis':'https://redis.io/docs/latest/develop/reference/eviction/',
 'PostgreSQL':'https://www.postgresql.org/docs/current/explicit-locking.html', 'MySQL':'https://dev.mysql.com/doc/refman/8.4/en/replication.html',
 'Apache Kafka':'https://kafka.apache.org/documentation/#consumerconfigs', 'RabbitMQ':'https://www.rabbitmq.com/docs/consumer-prefetch'
};
function references(tool){const base=refs[tool];if(base)return [base];const list=Object.entries(refs).filter(([k])=>tool.includes(k)||k.includes(tool.split(' + ')[0])).map(([,v])=>v);return [...new Set(list.length?list:['https://sre.google/sre-book/managing-incidents/'])].slice(0,3);}
const output=cases.flatMap((fields,i)=>phases.map((phase,j)=>{
 const id=31+i*5+j;
 // Distractors are other incident-specific proposals from the same difficulty band.
 // They remain stable across builds and are explicitly described as alternatives.
 const band=i<14?[0,14]:i<34?[14,34]:i<54?[34,54]:i<74?[54,74]:[74,94];
 const peers=[];for(let step=1;peers.length<3;step++){const at=band[0]+(i-band[0]+step*3)%(band[1]-band[0]);if(at!==i&&!peers.includes(at))peers.push(at);}
 return {id,caseId:i+1,phase:phase.name,tool:fields[0],title:`${fields[1]} · ${phase.name}`,prompt:`${fields[2]}\n\n${phase.ask}`,evidence:fields[2],options:[fields[phase.field],...peers.map(k=>cases[k][phase.field])],answer:0,explanation:`${fields[phase.field]} ${j===0?'The diagnosis matches the observed mechanism.':j===1?'This check targets the specific failure mechanism.':j===2?'The repair addresses the recorded cause while limiting collateral changes.':j===3?'Recovery must be confirmed on the original affected path.':'This control targets recurrence of the recorded failure.'}`,hint: j===0 ? fields[4] : j===1 ? 'Patch suspects: '+fields[3] : j===2 ? 'Target this cause: '+fields[3] : j===3 ? 'Verify the original failure path: '+fields[2] : 'Design a control around: '+fields[3],difficulty:Math.ceil(id/50),extreme:id>400,sources:references(fields[0])};
}));
fs.writeFileSync(new URL('../campaign.js',import.meta.url),`// Generated by scripts/build-campaign.mjs from editable incident cases.\nexport const campaign = ${JSON.stringify(output,null,2)};\n`);
console.log(`Built ${output.length} additional encounters from ${cases.length} distinct incident cases.`);
