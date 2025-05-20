# API Gateway / Service Mesh Example

For large-scale deployments, use an API gateway or service mesh. Example: NGINX as API gateway.

## Sample NGINX Config

```
http {
  upstream api_backend {
    server api1:3000;
    server api2:3000;
  }

  server {
    listen 80;
    server_name api.example.com;

    location /api/ {
      proxy_pass http://api_backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

For service mesh, consider Istio or Linkerd. See their docs for setup.
