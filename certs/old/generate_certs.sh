#!/bin/bash

# Set validity period in days
DAYS=3650

# Generate Root CA key and certificate
echo "Generating root CA private key..."
openssl genrsa -out ca-key.pem 2048

echo "Generating root CA certificate..."
openssl req -new -x509 -nodes -days $DAYS -key ca-key.pem -out ca-cert.pem -config ca.config

# Generate Intermediate CA key and CSR
echo "Generating intermediate CA private key..."
openssl genrsa -out intermediate-key.pem 2048

echo "Generating intermediate CA CSR..."
openssl req -new -key intermediate-key.pem -out intermediate-req.pem -config intermediate.config

# Sign Intermediate CA with Root CA
echo "Signing intermediate CA with root CA..."
openssl x509 -req -days $DAYS -in intermediate-req.pem -CA ca-cert.pem -CAkey ca-key.pem -CAcreateserial -out intermediate-cert.pem -extfile intermediate.config -extensions v3_ca

# Generate Server Key and Certificate
echo "Generating server private key and CSR..."
openssl req -newkey rsa:2048 -nodes -keyout server-key.pem -out server-req.pem -config server.config

# Sign Server Certificate with Intermediate CA
echo "Signing server certificate with intermediate CA..."
openssl x509 -req -days 365 -set_serial 01 -in server-req.pem -out server-cert.pem -CA intermediate-cert.pem -CAkey intermediate-key.pem -CAcreateserial -extfile server.config -extensions v3_req

# Generate Client Key and Certificate
echo "Generating client private key and CSR..."
openssl req -newkey rsa:2048 -nodes -keyout client-key.pem -out client-req.pem -config client.config

# Sign Client Certificate with Intermediate CA
echo "Signing client certificate with intermediate CA..."
openssl x509 -req -days 365 -set_serial 02 -in client-req.pem -out client-cert.pem -CA intermediate-cert.pem -CAkey intermediate-key.pem -CAcreateserial -extfile client.config -extensions v3_req

# Combine Root and Intermediate Certificates into a Chain File
cat intermediate-cert.pem ca-cert.pem > chain.pem

# Verify Certificates
echo "Verifying server certificate..."
openssl verify -CAfile chain.pem server-cert.pem && echo "Server certificate verified."

echo "Verifying client certificate..."
openssl verify -CAfile chain.pem client-cert.pem && echo "Client certificate verified."

echo "Certificate generation and verification complete."

# Keep the console open
read -p "Press Enter to exit..."
