require ('dotenv').config();

module.exports = {
  // openstack keystone
  KEYSTONE_URL: process.env.KEYSTONE_URL || 'http://192.168.1.100:5000/v3',
  KEYSTONR_VERSION: 'v3' , 

  //openstack swift
  SWIFT_URL: process.env.SWIFT_URL || 'http://192.168.1.100:8080/v1',

};