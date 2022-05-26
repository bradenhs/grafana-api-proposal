until [ -f /grafana/plugins/plugin.json ]
do
     echo "Checking for plugin..."
     sleep 1
done

/grafana/repo/bin/linux-amd64/grafana-server -config /grafana/config/grafana.ini -homepath /grafana/repo