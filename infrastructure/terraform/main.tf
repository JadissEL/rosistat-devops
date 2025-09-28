terraform {
  required_version = ">= 1.6.0"
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.29.0"
    }
  }
}

provider "kubernetes" {
  config_path = var.kubeconfig
}

variable "kubeconfig" {
  type        = string
  description = "Path to kubeconfig file"
}

resource "kubernetes_namespace" "rosistrat" {
  metadata { name = "rosistrat" }
}


