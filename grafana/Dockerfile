FROM mcr.microsoft.com/vscode/devcontainers/go:0-1.17

RUN umask 0002 && \
    . /usr/local/share/nvm/nvm.sh && \
    nvm install 16 2>&1 && \
    git clone --branch bradenhs/variables --single-branch https://github.com/bradenhs/grafana.git /grafana/repo

RUN cd /grafana/repo && NODE_OPTIONS=--max_old_space_size=8192 make all

COPY ./config /grafana/config

CMD /grafana/repo/bin/linux-amd64/grafana-server -config /grafana/config/grafana.ini -homepath /grafana/repo