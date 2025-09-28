# Monitoring & Logging

Ce dossier décrit une mise en place pragmatique de l’observabilité pour Rosistat.

## Objectifs
- Visibilité technique (latence, taux d’erreurs, saturation)
- Traçabilité (corrélation requêtes/logs)
- Alerting proactif (SLOs)

## Stack proposée
- Monitoring: Prometheus + Grafana (Helm chart kube-prometheus-stack)
- Logging: Fluent Bit + Elasticsearch/OpenSearch + Kibana (ou OpenSearch Dashboards)
- Traces (optionnel): OpenTelemetry Collector + Jaeger/Tempo

## Métriques minimales
- API: requêtes/s, p50/p95/p99 latence, 4xx/5xx rate
- Process: CPU, mémoire, redémarrages
- Conteneurs: CPU, mémoire, réseau

## Endpoints à ajouter (backend)
- `/metrics` (Prometheus format): compteurs requêtes, histogrammes latence
- Logs JSON (champ `traceId`), corrélés aux requêtes HTTP

## Déploiement Kubernetes (exemples)
- Installer kube-prometheus-stack:
  ```bash
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
  ```
- Installer Fluent Bit vers OpenSearch:
  - DaemonSet Fluent Bit
  - Secret `OPENSEARCH_URL`, index lifecycle

## Dashboards & Alertes
- Dashboards: latence API (p95), erreurs par route, saturation pod
- Alertes: `HighErrorRate`, `HighLatency`, `ContainerRestarting`

## Bonnes pratiques logs
- Format JSON
- Niveau: info/warn/error
- Ajout `traceId`, `route`, `statusCode`, `durationMs`
