kubectl apply -f namespace.yaml
kubectl apply -f pvc.yaml
kubectl apply -f loyalty-service-secret.yaml
kubectl apply -f ingress.yaml
kubectl apply -f web-deployment.yaml
kubectl apply -f web-service.yaml
kubectl apply -f loyalty-deployment.yaml
kubectl apply -f loyalty-service.yaml