#!/bin/bash
source .env
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa

sudo docker-compose build
sudo docker-compose push

# todo: make dirs automatically
scp docker-zettel-run.yml $SSH_USER@$SSH_HOST:$BUILD_DIR
scp nginx/nginx.conf $SSH_USER@$SSH_HOST:$BUILD_DIR/nginx/nginx.conf
ssh $SSH_USER@$SSH_HOST <<EOF

    cd $BUILD_DIR
    docker compose -f docker-zettel-run.yml pull
    docker compose -f docker-zettel-run.yml up -d
EOF
