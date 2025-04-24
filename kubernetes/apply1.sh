kubectl apply -f namespace.yaml
kubectl apply -f forex-admin-secret.yaml
kubectl apply -f loyalty-service-secret.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f frontend-service.yaml