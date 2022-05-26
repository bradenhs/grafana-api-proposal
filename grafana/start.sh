until [ -f /grafana/plugins/plugin.json ]
do
     echo "Wating for plugin build to complete..."
     sleep 2
done

/grafana/repo/bin/linux-amd64/grafana-server -config /grafana/config/grafana.ini -homepath /grafana/repo