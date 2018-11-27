# bind-cli
`bind-cli` is a CLI client used to interact with a BIND DNS server.  
It provides an interface for programmatic query, creation and deletion of DNS records and their zones.

It is intended to be stupidly simple.  
Ideal for lab purposes.  

## Install
`bind-cli` can be installed natively **via NPM** or consumed using a pre-built docker image.  
`bind-cli` **via NPM** assumes that BIND is installed and configured on the local server (see **BIND Installation**).  

**Note**: Usage **via Docker** pre-built image has BIND already configured and you can skip **BIND Installation**.  

### via NPM
`bind-cli` requires that BIND - along with RNDC and NSUPDATE subsystems are configured on your system.  
Once installed, `bind-cli` can be leveraged directly via the `bind-cli` shell command - see **Usage** below
```
npm install bind-cli --global
```

#### BIND Installation
Here is an example of a working BIND configuration (on Centos).  
RNDC access is configured to be restricted to localhost.  
BIND will also forward to `8.8.8.8` and `8.8.8.4` for dns queries without a local zone.

```shell
yum install bind bind-utils
```

System conf files are crafted as follows;  

##### /etc/bind/named.conf
This is the base BIND server configuration, including upstream forwarders.  
```shell
options {
	directory "/var/bind";
	allow-query	{ 0.0.0.0/0; };
	allow-transfer	{ 0.0.0.0/0; };
	allow-new-zones yes;
	recursion yes;
	forwarders {
		8.8.8.4;
		8.8.8.8;
	};
	dnssec-enable yes;
	dnssec-validation yes;
};
include "/var/bind/named.conf.local";
```

##### /var/bind/named.conf.local
This configures additional BIND logging options, and specifies the RNDC key and scope (local only).  
```shell
logging {
        channel "default_syslog" {
                file "/var/log/named.log" versions 3 size 5m;
                severity debug;
        };
        category default { default_syslog; };
        category general { default_syslog; };
        category config { default_syslog; };
        category security { default_syslog; };
        category resolver { default_syslog; };
        category xfer-in { default_syslog; };
        category xfer-out { default_syslog; };
        category notify { default_syslog; };
        category client { default_syslog; };
        category network { default_syslog; };
        category update { default_syslog; };
        category queries { default_syslog; };
        category lame-servers { default_syslog; };
};
controls {   
	inet 127.0.0.1 allow { localhost; } 
	keys { dnsctl; };
};
key "dnsctl" {   
	algorithm hmac-md5;   
	secret "S9agqVPtjiI=";
};
```

##### /etc/bind/rndc.conf
This configures a local shared-secret key for the RNDC client to interact with BIND.  
The key name and secret must match those configured in **/etc/bind/named.conf.local**  
```shell
options {   
	default-server  localhost;   
	default-key     "dnsctl"; 
};
key "dnsctl" {
	algorithm hmac-md5;
	secret "S9agqVPtjiI=";
};
```

##### /var/bind/zonedb.json
This creates a blank database file used by `bind-cli` to track zones and records.
```shell
{}
```

### via Docker
**exec (launch + persist)**  
This is where we start the container using `docker run` with the required parameters set.  
Subsequent commands are then issued using `docker exec` commands.  

Start the container in background attached to host network:
```
docker run -id --net host --name dns apnex/bind-cli
```

Then issue one or more `docker exec` commands:
```
docker exec -t dns bind-cli <cmd>
```
**Where:**  
- `<cmd>` is one of the available commands (see **Usage**)

Clean up docker container when done:
```
docker rm -f dns
```

See **Usage** for examples  

`bind-cli` is intended to be stupid simple with only a few `<cmd>`.  
One just needs to configure records - zone creation and deletion are handled automatically by the system.  

**`<cmd>`**
- `record.create`  
- `record.delete`  
- `zone.list`  
- `record.import`  
- `record.export`

## Usage
#### bind-cli record.create
This command creates a new `A` record and `PTR` record for a given `fqdn:addr` pair.  
Forward and reverse zones will automatically be created if required.  

command usage: **record.create `<name> <addr>`**  
**Where:**  
- `<name>` is the FQDN
- `<addr>` is the ip-address used for the A and PTR records  

**Example:**
<pre>
<b>bind-cli record.create vcsa.lab 172.16.0.13
bind-cli record.create nsxm.lab 172.16.10.15
bind-cli record.create sddc.lab 172.16.0.11</b>
</pre>

#### bind-cli record.delete
This command deletes an `A` record and `PTR` record for a given `fqdn`.  
Forward and reverse zones will automatically be deleted if this results in an empty zone.  

command usage: **record.delete `<name>`**  
**Where:**  
- `<name>` is the FQDN

**Example:**
<pre>
<b>bind-cli record.delete vcsa.lab
bind-cli record.delete nsxm.lab
bind-cli record.delete sddc.lab</b>
</pre>

#### bind-cli zone.list
`zone.list` displays all configured zones and their records.  

command usage: **zone.list `[ <filter> ]`**  
**Where:**  
- `<filter>` is the standard **filter** syntax  

See **Examples** for additional informations.  

**Example:**
<pre>
<b>bind-cli zone.list</b>
</pre>

## Examples
#### Search and filter records

Display all zones and records  
```
$ bind-cli zone.list 
zone                    key                          ttl    view  type  value                                          
----------------------  ---------------------------  -----  ----  ----  ---------------------------------------------  
0.16.172.in-addr.arpa   0.16.172.in-addr.arpa.       86400  IN    SOA   ns1.lab. mail.lab. 102 3600 1800 604800 86400  
0.16.172.in-addr.arpa   0.16.172.in-addr.arpa.       86400  IN    NS    ns1.lab.                                       
0.16.172.in-addr.arpa   11.0.16.172.in-addr.arpa.    86400  IN    PTR   sddc.lab.                                      
0.16.172.in-addr.arpa   13.0.16.172.in-addr.arpa.    86400  IN    PTR   vcsa.lab.                                      
0.16.172.in-addr.arpa   ns1.0.16.172.in-addr.arpa.   86400  IN    A     172.17.0.1                                     
10.16.172.in-addr.arpa  10.16.172.in-addr.arpa.      86400  IN    SOA   ns1.lab. mail.lab. 101 3600 1800 604800 86400  
10.16.172.in-addr.arpa  10.16.172.in-addr.arpa.      86400  IN    NS    ns1.lab.                                       
10.16.172.in-addr.arpa  15.10.16.172.in-addr.arpa.   86400  IN    PTR   nsxm.lab.                                      
10.16.172.in-addr.arpa  ns1.10.16.172.in-addr.arpa.  86400  IN    A     172.17.0.1                                     
lab                     lab.                         86400  IN    SOA   ns1.lab. mail.lab. 103 3600 1800 604800 86400  
lab                     lab.                         86400  IN    NS    ns1.lab.                                       
lab                     ns1.lab.                     86400  IN    A     172.17.0.1                                     
lab                     nsxm.lab.                    86400  IN    A     172.16.10.15                                   
lab                     sddc.lab.                    86400  IN    A     172.16.0.11                                    
lab                     vcsa.lab.                    86400  IN    A     172.16.0.13                                    
[ 15/15 ] entries - filter [ key: ]
```

Display all records within zone lab  
**Note**: `<filter>` defaults to **key** if no column specified  
```
$ bind-cli zone.list lab
zone  key        ttl    view  type  value                                          
----  ---------  -----  ----  ----  ---------------------------------------------  
lab   lab.       86400  IN    SOA   ns1.lab. mail.lab. 103 3600 1800 604800 86400  
lab   lab.       86400  IN    NS    ns1.lab.                                       
lab   ns1.lab.   86400  IN    A     172.17.0.1                                     
lab   nsxm.lab.  86400  IN    A     172.16.10.15                                   
lab   sddc.lab.  86400  IN    A     172.16.0.11                                    
lab   vcsa.lab.  86400  IN    A     172.16.0.13                                    
[ 6/15 ] entries - filter [ key:lab ]
```

Display all records that contain `lab` as part of **key**  
Same output as above, but explicitly defining the column **key**  
```
$ bind-cli zone.list key:lab
zone  key        ttl    view  type  value                                          
----  ---------  -----  ----  ----  ---------------------------------------------  
lab   lab.       86400  IN    SOA   ns1.lab. mail.lab. 103 3600 1800 604800 86400  
lab   lab.       86400  IN    NS    ns1.lab.                                       
lab   ns1.lab.   86400  IN    A     172.17.0.1                                     
lab   nsxm.lab.  86400  IN    A     172.16.10.15                                   
lab   sddc.lab.  86400  IN    A     172.16.0.11                                    
lab   vcsa.lab.  86400  IN    A     172.16.0.13                                    
[ 6/15 ] entries - filter [ zone:lab ]
```

Filter and display any records in `zone:lab` that (regex) match the key string `nsx`  
```
$ bind-cli zone.list zone:lab,key:nsx
zone  key        ttl    view  type  value         
----  ---------  -----  ----  ----  ------------  
lab   nsxm.lab.  86400  IN    A     172.16.10.15  
[ 1/15 ] entries - filter [ zone:lab,key:nsx ]
$
```

## License

MIT © [Andrew Obersnel](https://github.com/apnex)
