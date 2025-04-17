sudo kubectl apply -f namespace.yaml
sudo kubectl apply -f forex-admin-deployment.yaml
sudo kubectl apply -f forex-admin-service.yaml
sudo kubectl apply -f mssql-secret.yaml
sudo kubectl apply -f jwt-secret.yaml
sudo kubectl apply -f pvc.yaml

sudo kubectl delete namespace forex-crm