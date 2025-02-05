#!/bin/bash
source .env
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa

sudo docker-compose build
sudo docker-compose push

scp docker-zettel-run.yml $SSH_USER@$SSH_HOST:$BUILD_DIR
ssh $SSH_USER@$SSH_HOST <<EOF
    cd $BUILD_DIR
    docker compose -f docker-zettel-run.yml pull
    docker compose -f docker-zettel-run.yml up -d
EOF
