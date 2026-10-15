const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const certificatePath = path.join(
  __dirname,
  "certificates",
  "digital-certificate.txt",
);

const privateKeyPath = path.join(__dirname, "certificates", "private-key.pem");

const certificate = fs.readFileSync(certificatePath, "utf8");
const privateKey = fs.readFileSync(privateKeyPath, "utf8");

const sign = (data) => {
  const signer = crypto.createSign("SHA256");

  signer.update(data);
  signer.end();

  return signer.sign(privateKey, "base64");
};

const getCertificate = () => certificate;

module.exports = {
  sign,
  getCertificate,
};

console.log("QZ signing service loaded successfully");
