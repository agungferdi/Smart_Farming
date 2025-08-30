#!/usr/bin/env python3

# This script pulls the list of Mozilla trusted certificate authorities
# from the web at the "mozurl" below, parses the file to grab the PEM
# for each cert, and then generates DER files in a new ./data directory
# Upload these to an on-chip filesystem and use the CertManager to parse
# and use them for your outgoing SSL connections.
#
# Script by Earle F. Philhower, III.  Released to the public domain.
from __future__ import print_function
import csv
import os
import sys
from shutil import which

from io import StringIO
from subprocess import Popen, PIPE, call, CalledProcessError
from urllib.request import urlopen

# check if ar and openssl are available
if which('ar') is None and not os.path.isfile('./ar') and not os.path.isfile('./ar.exe'):
    print("Warning: 'ar' not found in PATH. Trying to continue...")
if which('openssl') is None and not os.path.isfile('./openssl') and not os.path.isfile('./openssl.exe'):
    raise Exception("You need to have openssl in PATH, installable from https://www.openssl.org/")
    
# Mozilla's URL for the CSV file with included PEM certs
mozurl = "https://ccadb.my.salesforce-sites.com/mozilla/IncludedCACertificateReportPEMCSV"

# Load the names[] and pems[] array from the URL
names = []
pems = []
response = urlopen(mozurl)
csvData = response.read()
if sys.version_info[0] > 2:
    csvData = csvData.decode('utf-8')
csvFile = StringIO(csvData)
csvReader = csv.reader(csvFile)
for row in csvReader:
    names.append(row[0]+":"+row[1]+":"+row[2])
    for item in row:
        if item.startswith("'-----BEGIN CERTIFICATE-----"):
            pems.append(item)
del names[0] # Remove headers

# Try and make ./data, skip if present
try:
    os.mkdir("data")
except Exception:
    pass

derFiles = []
idx = 0
# Process the text PEM using openssl into DER files
for i in range(0, len(pems)):
    certName = "data/ca_%03d.der" % (idx);
    thisPem = pems[i].replace("'", "")
    print(names[i] + " -> " + certName)
    ssl = Popen(['openssl','x509','-inform','PEM','-outform','DER','-out', certName], shell = False, stdin = PIPE)
    ssl.communicate(thisPem.encode('utf-8'))
    ret = ssl.wait()
    if ret != 0:
        print(f"Warning: Failed to process certificate {certName}, skipping...")
        continue
    if os.path.exists(certName):
        derFiles.append(certName)
        idx = idx + 1

if os.path.exists("data/certs.ar"):
    os.unlink("data/certs.ar");

# Try to create the archive - use system ar if available
try:
    arCmd = ['ar', 'q', 'data/certs.ar'] + derFiles;
    call( arCmd )
    print(f"Created data/certs.ar with {len(derFiles)} certificates")
except:
    print("Warning: Could not create certs.ar archive. Certificates are available as individual .der files")

# Create an index file for ESP32
with open("data/certs.idx", "w") as idx_file:
    for i, der_file in enumerate(derFiles):
        idx_file.write(f"{i:03d}.der\n")

print(f"Generated {len(derFiles)} certificate files in data/ directory")
print("Files created:")
print("- data/certs.ar (certificate archive)")
print("- data/certs.idx (certificate index)")
print(f"- {len(derFiles)} individual .der certificate files")

# Clean up individual DER files since we have the archive
for der in derFiles:
    if os.path.exists(der):
        os.unlink(der)

print("Certificate generation complete!")
