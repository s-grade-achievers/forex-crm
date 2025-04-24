kubectl apply -f namespace.yaml
kubectl apply -f jwt-secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f postgres-secret.yaml
kubectl apply -f forex-admin-secret.yaml
kubectl apply -f loyalty-service-secret.yaml
kubectl create configmap postgres-initdb-scripts \
    --from-file=postgres1-init.sql=../forex-admin/db/init.sql \
    --from-file=postgres-init.sql=../forex-client/initdb.sql \
    -n forex-crm
kubectl create configmap static-html --from-file=index.html=index.html -n forex-crm
kubectl create secret tls forex-crm-tls \
  --cert=nginx.crt \
  --key=nginx.key \
  -n forex-crm
  
kubectl apply -f ingress.yaml
kubectl apply -f ingress-client.yaml
kubectl apply -f ingress-https.yaml
kubectl apply -f nginx-deployment.yaml
kubectl apply -f nginx-service.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml
kubectl apply -f forex-admin-deployment.yaml
kubectl apply -f forex-admin-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml
kubectl apply -f loyalty-deployment.yaml
kubectl apply -f loyalty-service.yaml
kubectl apply -f booking-deployment.yaml
kubectl apply -f booking-service.yaml
echo https://api.forex-crm.local
kubectl exec -it  $(kubectl get pod -n forex-crm -l app=forex-admin -o jsonpath="{.items[0].metadata.name}") -n forex-crm -- node src/server.js
