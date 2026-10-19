export const labs = {
  ai: {
    slug: "ai",
    name: "Advanced AI Lab",
    shortName: "AI Lab",
    headline: "Explore, train and fine-tune large language models.",
    intro:
      "The AI Lab is a working environment for engineers and researchers who want to understand how modern language models are built, adapted and evaluated. You will move from model internals to production-style systems, and you will measure every change you make.",
    pillars: [
      {
        title: "Model foundations",
        text: "Understand attention, tokenisation and embeddings well enough to debug a model rather than guess at it.",
      },
      {
        title: "Fine-tuning",
        text: "Adapt open-weight models with LoRA and QLoRA on curated datasets, and track each run so results can be reproduced.",
      },
      {
        title: "Retrieval and grounding",
        text: "Connect models to documents through retrieval pipelines so that answers can be traced to their sources.",
      },
      {
        title: "Evaluation and safety",
        text: "Judge models with held-out tests, human review and red-team exercises before anything reaches users.",
      },
    ],
    capabilities: [
      "Supervised fine-tuning and parameter-efficient adaptation",
      "Preference alignment concepts, including DPO and RLHF",
      "Vector search and retrieval-augmented generation",
      "Quantisation and latency-aware model serving",
      "Benchmarking with repeatable metrics",
      "Prompt injection testing for LLM applications",
    ],
    codeTitle: "lora_finetune.yaml",
    code: [
      { text: "base_model: open-weights-7b", tone: "muted" },
      { text: "method: qlora", tone: "gold" },
      { text: "lora:", tone: "muted" },
      { text: "  rank: 16", tone: "body" },
      { text: "  alpha: 32", tone: "body" },
      { text: "  target_modules: [q_proj, v_proj]", tone: "body" },
      { text: "train:", tone: "muted" },
      { text: "  epochs: 3", tone: "body" },
      { text: "  learning_rate: 2e-4", tone: "body" },
      { text: "eval:", tone: "muted" },
      { text: "  held_out_split: 0.1", tone: "body" },
      { text: "  metrics: [accuracy, rouge_l, refusal_rate]", tone: "gold" },
    ],
  },
  cyber: {
    slug: "cyber",
    name: "Cyber Security Lab",
    shortName: "Cyber Lab",
    headline: "Learn to attack, defend and investigate, safely.",
    intro:
      "The Cyber Security Lab teaches the skills that organisations rely on: finding weaknesses before attackers do, watching for intrusions, and reconstructing incidents afterwards. Offensive techniques are practised only in isolated lab networks, under written rules of engagement.",
    pillars: [
      {
        title: "Penetration testing",
        text: "Follow a full methodology from reconnaissance to reporting, against systems built for training.",
      },
      {
        title: "Security operations",
        text: "Monitor, triage and hunt threats using SIEM platforms, detection rules and MITRE ATT&CK.",
      },
      {
        title: "Digital forensics",
        text: "Preserve evidence correctly, analyse disk and memory images, and build a verified timeline of an intrusion.",
      },
      {
        title: "Application and cloud security",
        text: "Find and fix authorisation, injection and configuration flaws in web applications, APIs and cloud environments.",
      },
    ],
    capabilities: [
      "Reconnaissance, scanning and service enumeration",
      "Web application testing with Burp Suite and OWASP ZAP",
      "Active Directory attack paths and defensive hardening",
      "Log analysis and detection engineering with Sigma rules",
      "Disk and memory forensics with Autopsy and Volatility",
      "Professional reporting with risk ratings and remediation",
    ],
    codeTitle: "scan-scope.txt",
    code: [
      { text: "# Authorised lab range only", tone: "muted" },
      { text: "scope: 10.20.0.0/24 (isolated)", tone: "gold" },
      { text: "rules_of_engagement: signed", tone: "gold" },
      { text: "", tone: "body" },
      { text: "$ nmap -sV -p- 10.20.0.14", tone: "body" },
      { text: "22/tcp   open  ssh     OpenSSH 8.9", tone: "muted" },
      { text: "80/tcp   open  http    nginx 1.24", tone: "muted" },
      { text: "445/tcp  open  smb     Windows Server", tone: "muted" },
      { text: "", tone: "body" },
      { text: "finding: outdated service detected", tone: "gold" },
      { text: "report: written, rated, remediation attached", tone: "body" },
    ],
  },
};

export const labCodeOfConduct = [
  "Techniques are taught only in isolated, authorised lab environments.",
  "Students test only systems they own or have written permission to test.",
  "Every exercise has defined scope, rules of engagement and a supervising instructor.",
  "Findings are reported responsibly. Vulnerabilities are never exploited outside the lab.",
];
