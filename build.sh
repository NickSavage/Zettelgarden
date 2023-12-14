#!/bin/bash
source .env
sudo docker-compose build
sudo docker-compose push

ssh root@192.168.0.162 <<EOF
    cd /root/docker
    docker-compose -f zettel.yml pull
    docker-compose -f zettel.yml up -d
EOF
