"use strict";

const node_mailer = require("nodemailer");
const config = require("../config.json");

let smtp_transport = node_mailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_SECURE,
  auth: {
    user: config.SMTP_AUTH_USER,
    pass: config.SMTP_AUTH_PASSWORD
  }
});


exports.sendMail = async function(to, subject, html) {
  try {
    let mailOptions = {
      to: to,
      from: config.SMTP_AUTH_USER,
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
