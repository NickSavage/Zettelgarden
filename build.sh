#!/bin/bash
source .env
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa

sudo docker-compose build
sudo docker-compose push

ssh root@zettelgarden <<EOF
    cd /root/docker
    docker compose -f zettel.yml pull
    docker compose -f zettel.yml up -d
EOF
