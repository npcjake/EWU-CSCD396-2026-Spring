variable "resource_group_name" {
  type    = string
  default = "rg-assignment2"
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "web_app_name" {
  type    = string
  default = "cscd396-jake-webapp2"
}

variable "acr_name" {
  type    = string
  default = "acrjakea2"
}

variable "container_image_name" {
  description = "Container image name and tag to deploy (e.g. myimage:abc1234)"
  type        = string
}

variable "storage_account_name" {
  type    = string
  default = "sajakea2cscd396"
}

variable "key_vault_name" {
  type    = string
  default = "kv-jake-assn2"
}

variable "secret_name" {
  type    = string
  default = "MySecret"
}

variable "secret_value" {
  type      = string
  sensitive = true
  default   = "HelloFromKeyVault"
}

variable "grader_object_id" {
  description = "Object ID for jcurry9@ewu.edu grader account"
  type        = string
  default     = "d47ae8fc-4416-44be-93c4-008253c2629c"
}
