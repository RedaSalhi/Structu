# scripts/logs.sh
#!/bin/bash

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Logs de tous les services:"
    docker-compose logs --tail=100 -f
else
    echo "📋 Logs du service: $SERVICE"
    docker-compose logs --tail=100 -f $SERVICE
fi

