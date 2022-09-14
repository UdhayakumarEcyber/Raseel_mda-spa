
// multiple ipAddress Eg: 198.168.0.2,198.168.0.3
export const ipAddress = /^((((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\,?)*)-?)*$/
// mac-address Eg: 0A:1C:5D:6b:7f:9a
export const macAddress = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
// accepts all alphabets and number Eg: azAB09as
export const allAphabetsAndNumber = /^([a-zA-Z0-9\s])*$/
// email Eg: somename@gmail.com
export const email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

