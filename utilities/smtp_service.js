"use strict";

const node_mailer = require("nodemailer");

let smtp_transport = node_mailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_AUTH_USER,
    pass: process.env.SMTP_AUTH_PASSWORD
  }
});


exports.sendMail = async function(to, subject, html) {
  try {
    let mailOptions = {
      to: to,
      from: "ianfe@martinastore.com.co",
      subject: subject,
      html: html
    };
    return await smtp_transport.sendMail(mailOptions).then((mail) => {
      return true;
    }).catch((err) => {
      console.log(err);
      return false;
    });
  } catch(err) {
    console.log(err);
  }
};