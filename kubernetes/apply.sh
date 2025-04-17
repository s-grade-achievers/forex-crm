kubectl apply -f namespace.yaml
kubectl apply -f forex-admin-secret.yaml
kubectl apply -f mssql-secret.yaml
kubectl apply -f jwt-secret.yaml
kubectl apply -f pvc.yaml
kubectl apply -f postgres-secret.yaml
kubectl create configmap mssql-init-scripts --from-file=../forex-admin/db/ -n forex-crm
kubectl create configmap postgres-initdb-script --from-file=../forex-client/initdb.sql -n forex-crm
kubectl apply -f mssql-deployment.yaml
kubectl apply -f mssql-service.yaml
kubectl apply -f forex-admin-deployment.yaml
kubectl apply -f forex-admin-service.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml
kubectl apply -f loyalty-deployment.yaml
kubectl apply -f loyalty-service.yaml

# kubectl delete namespace forex-crm