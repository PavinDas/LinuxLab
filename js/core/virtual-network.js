import { SYSTEM_INFO } from './system-info.js';

/**
 * VirtualNetwork
 * Simulates network interfaces, routing, ARP, DNS resolution, and controlled
 * educational penetration testing lab targets (e.g. 192.168.1.10 Metasploitable lab).
 * Strictly isolated: never contacts real networks!
 */
export class VirtualNetwork {
  constructor() {
    this.hostname = SYSTEM_INFO.hostname;
    this.domain = 'cyberlinux.local';

    this.interfaces = [
      {
        name: 'lo',
        type: 'loopback',
        mac: '00:00:00:00:00:00',
        ipv4: '127.0.0.1/8',
        ipv6: '::1/128',
        flags: ['LOOPBACK', 'UP', 'LOWER_UP'],
        mtu: 65536,
        state: 'UNKNOWN',
        rxBytes: 142080,
        txBytes: 142080
      },
      {
        name: 'eth0',
        type: 'ethernet',
        mac: '08:00:27:fa:41:22',
        ipv4: '192.168.1.50/24',
        broadcast: '192.168.1.255',
        ipv6: 'fe80::a00:27ff:fefa:4122/64',
        flags: ['BROADCAST', 'MULTICAST', 'UP', 'LOWER_UP'],
        mtu: 1500,
        state: 'UP',
        rxBytes: 5241088,
        txBytes: 1840212
      },
      {
        name: 'wlan0',
        type: 'wireless',
        mac: '52:54:00:12:34:56',
        ipv4: '10.0.0.15/24',
        broadcast: '10.0.0.255',
        ipv6: 'fe80::5054:ff:fe12:3456/64',
        flags: ['BROADCAST', 'MULTICAST', 'UP', 'LOWER_UP'],
        mtu: 1500,
        state: 'UP',
        rxBytes: 984022,
        txBytes: 421090
      }
    ];

    this.routes = [
      { destination: 'default', gateway: '192.168.1.1', iface: 'eth0', proto: 'dhcp', metric: 100 },
      { destination: '10.0.0.0/24', gateway: '0.0.0.0', iface: 'wlan0', proto: 'kernel', metric: 600 },
      { destination: '192.168.1.0/24', gateway: '0.0.0.0', iface: 'eth0', proto: 'kernel', metric: 100 }
    ];

    this.arpTable = [
      { ip: '192.168.1.1', mac: '00:50:56:c0:00:08', iface: 'eth0', state: 'REACHABLE' },
      { ip: '192.168.1.10', mac: '00:0c:29:84:11:bc', iface: 'eth0', state: 'STALE' }, // Lab target
      { ip: '192.168.1.105', mac: '08:00:27:de:ad:01', iface: 'eth0', state: 'DELAY' }
    ];

    this.dnsRecords = {
      'cyberlinux.local': { A: '192.168.1.50', TXT: 'v=spf1 -all' },
      'lab.cyberlinux.local': { A: '192.168.1.10' },
      'gateway.local': { A: '192.168.1.1' },
      'example.com': {
        A: '93.184.216.34',
        MX: '10 mail.example.com',
        NS: 'a.iana-servers.net, b.iana-servers.net',
        TXT: 'v=spf1 -all'
      },
      'google.com': {
        A: '142.250.190.46',
        MX: '10 smtp.google.com',
        NS: 'ns1.google.com, ns2.google.com',
        TXT: 'v=spf1 include:_spf.google.com ~all'
      }
    };

    // Lab Targets with rich service details for nmap/nikto/gobuster
    this.labTargets = {
      '192.168.1.10': {
        name: 'Metasploitable Lab Machine',
        os: 'Linux 2.6.x (Ubuntu 8.04)',
        ports: [
          { port: 21, proto: 'tcp', service: 'ftp', product: 'vsftpd', version: '2.3.4', state: 'open' },
          { port: 22, proto: 'tcp', service: 'ssh', product: 'OpenSSH', version: '4.7p1 Debian 8ubuntu1', state: 'open' },
          { port: 25, proto: 'tcp', service: 'smtp', product: 'Postfix smtpd', state: 'open' },
          { port: 53, proto: 'tcp', service: 'domain', product: 'ISC BIND', version: '9.4.2', state: 'open' },
          { port: 80, proto: 'tcp', service: 'http', product: 'Apache httpd', version: '2.2.8 ((Ubuntu) DAV/2)', state: 'open' },
          { port: 443, proto: 'tcp', service: 'https', product: 'Apache httpd', version: '2.2.8 SSL', state: 'open' },
          { port: 3306, proto: 'tcp', service: 'mysql', product: 'MySQL', version: '5.0.51a-3ubuntu5', state: 'open' },
          { port: 5432, proto: 'tcp', service: 'postgresql', product: 'PostgreSQL DB', version: '8.3.0', state: 'open' },
          { port: 8080, proto: 'tcp', service: 'http-proxy', product: 'Apache Tomcat/Coyote JSP engine', version: '1.1', state: 'open' }
        ],
        webDirectories: [
          { path: '/admin', code: 200, size: 1420 },
          { path: '/login', code: 200, size: 890 },
          { path: '/uploads', code: 301, size: 310 },
          { path: '/backup', code: 200, size: 4500 },
          { path: '/secret', code: 403, size: 280 },
          { path: '/api', code: 200, size: 620 },
          { path: '/phpmyadmin', code: 200, size: 2840 },
          { path: '/robots.txt', code: 200, size: 120 }
        ]
      },
      '127.0.0.1': {
        name: `Localhost (${SYSTEM_INFO.osName})`,
        os: `${SYSTEM_INFO.osName} (Linux 6.8.0)`,
        ports: [
          { port: 22, proto: 'tcp', service: 'ssh', product: 'OpenSSH', version: '8.9p1 Ubuntu', state: 'open' },
          { port: 80, proto: 'tcp', service: 'http', product: 'nginx', version: '1.18.0', state: 'open' }
        ],
        webDirectories: [
          { path: '/', code: 200, size: 1040 }
        ]
      }
    };
  }

  ping(host, count = 4) {
    const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '192.168.1.50';
    const isKnown = this.labTargets[host] || this.dnsRecords[host] || host === '8.8.8.8' || host === '1.1.1.1' || host === '192.168.1.1';
    
    if (!isKnown && !isLocal) {
      return { success: false, error: `ping: ${host}: Name or service not known` };
    }

    const lines = [
      `PING ${host} (${isLocal ? '127.0.0.1' : (this.dnsRecords[host]?.A || host)}) 56(84) bytes of data.`
    ];

    let minTime = 999, maxTime = 0, sumTime = 0;
    for (let seq = 1; seq <= count; seq++) {
      const ms = isLocal ? (0.03 + Math.random() * 0.02).toFixed(3) : (12.4 + Math.random() * 8.2).toFixed(3);
      const val = parseFloat(ms);
      minTime = Math.min(minTime, val);
      maxTime = Math.max(maxTime, val);
      sumTime += val;
      lines.push(`64 bytes from ${host}: icmp_seq=${seq} ttl=${isLocal ? 64 : 54} time=${ms} ms`);
    }

    const avg = (sumTime / count).toFixed(3);
    lines.push(``);
    lines.push(`--- ${host} ping statistics ---`);
    lines.push(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count * 1000}ms`);
    lines.push(`rtt min/avg/max/mdev = ${minTime}/${avg}/${maxTime}/${(maxTime - minTime).toFixed(3)} ms`);

    return { success: true, output: lines.join('\n') };
  }

  resolveDNS(domain, recordType = 'A') {
    const record = this.dnsRecords[domain];
    if (!record) {
      return { success: false, error: `** server can't find ${domain}: NXDOMAIN` };
    }
    const val = record[recordType.toUpperCase()] || record['A'];
    return { success: true, domain, recordType, value: val };
  }

  scanTarget(targetIp) {
    const target = this.labTargets[targetIp] || this.labTargets['192.168.1.10'];
    return target;
  }

  getSocketTable() {
    return [
      { proto: 'tcp', state: 'LISTEN', recvQ: 0, sendQ: 0, localAddr: '0.0.0.0:22', peerAddr: '0.0.0.0:*', pid: '1240/sshd' },
      { proto: 'tcp', state: 'LISTEN', recvQ: 0, sendQ: 0, localAddr: '0.0.0.0:80', peerAddr: '0.0.0.0:*', pid: '1100/nginx' },
      { proto: 'tcp', state: 'LISTEN', recvQ: 0, sendQ: 0, localAddr: '127.0.0.53:53', peerAddr: '0.0.0.0:*', pid: '520/systemd-resolve' },
      { proto: 'udp', state: 'UNCONN', recvQ: 0, sendQ: 0, localAddr: '0.0.0.0:68', peerAddr: '0.0.0.0:*', pid: '680/NetworkManager' },
      { proto: 'tcp', state: 'ESTAB', recvQ: 0, sendQ: 0, localAddr: '192.168.1.50:22', peerAddr: '192.168.1.105:41224', pid: '1402/sshd' }
    ];
  }
}
