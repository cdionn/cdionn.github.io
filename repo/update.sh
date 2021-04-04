echo "============================="
echo "Removing Nitendo DS"

find . -name '.DS_Store' -delete

echo "Remove Packages if exists*"
echo "Ignore any errors here..............."
rm Packages*

echo "Scanning and Building"
dpkg-scanpackages -m ./debs > Packages
bzip2 Packages
echo "DONE!"
echo "============================="
