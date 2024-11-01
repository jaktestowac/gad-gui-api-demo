# How To

## Automated tests with self-signed certificates

[experimental, not fully working]

To use it in Playwright tests, use following configuration:

```
use: {
    baseURL: "https://127.0.0.1:3001",

    trace: "on",
    clientCertificates: [
      {
        origin: "https://127.0.0.1:3001",
        certPath: "./certs/client-cert.pem",
        keyPath: "./certs/client-key.pem",
      },
    ],
  },
```

Those setting ignores errors related to self-signed certificates but also does not require clientCertificates:

```
use: {
    baseURL: "https://127.0.0.1:3001",

    trace: "on",
    bypassCSP: true,
    launchOptions: {
      args: ["--disable-web-security"],
    },
    ignoreHTTPSErrors: true,
    clientCertificates: [
      {
        origin: "https://127.0.0.1:3001",
        certPath: "./certs/client-cert.pem",
        keyPath: "./certs/client-key.pem",
      },
    ],
  },
```

## Generate new certificates

Use OpenSSL to generate new certificates.

Command to generate a new private key:

```
openssl genrsa -out key.pem
```

Command to generate a certificate signing request:

```
openssl req -new -key key.pem -out csr.pem
```

_Note: The -new option specifies that a new certificate signing request will be generated._

_Note: You will be asked to provide information about the certificate. You can skip any questions by pressing Enter._

Command to generate a new certificate:

```
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
```

_Note: x509 is a standard defining the format of public key certificates. It is used to sign certificates._

_Note: The -days 365 option specifies that the certificate will be valid for 365 days._
