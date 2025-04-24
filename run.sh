#!/bin/bash
minikube start
eval $(minikube docker-env)

echo "ssl"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx.key -out nginx.crt \
  -subj "/C=US/ST=California/L=San Francisco/O=Forex CRM/OU=IT/CN=api.forex-crm.local"

cp nginx.key ./kubernetes/nginx.key
cp nginx.crt ./kubernetes/nginx.crt
mv nginx.key ./forex-admin/src/server.key
mv nginx.crt ./forex-admin/src/server.cert

echo "docker build"
sudo docker build -t forex-crm_forex-admin:latest ./forex-admin/
sudo docker build -t forex-crm_frontend:latest ./forex-client/client
sudo docker build -t forex-crm_backend:latest ./forex-client/server
# sudo docker build -t forex-crm_loyalty-service:latest ./loyalty
# sudo docker build -t forex-crm_web:latest ./offers
sudo docker build -t forex-crm_booking-service:latest ./booking-service

echo "Load images to minikube"
minikube image load forex-crm_forex-admin:latest
minikube image load forex-crm_frontend:latest
minikube image load forex-crm_backend:latest
# minikube image load forex-crm_loyalty-service:latest
# minikube image load forex-crm_web:latest
minikube image load postgres:14
minikube image load forex-crm_booking-service:latest
minikube addons enable ingress

echo "k8s"
cd ./kubernetes
sh apply.sh

