require ('dotenv').config();

module.exports = {
  // openstack keystone
  KEYSTONE_URL: process.env.KEYSTONE_URL,
  KEYSTONR_VERSION: 'v3' , 

  //openstack swift
  SWIFT_URL: process.env.SWIFT_URL

};