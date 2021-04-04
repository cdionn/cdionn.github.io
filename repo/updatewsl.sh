echo "============================="
echo "Removing Nitendo DS"

echo "Remove Packages if exists*"
echo "Ignore any errors here..............."
rm Packages*

echo "Scanning and Building"
python3 dpkg-scanpackages.py -m ./debs > Packages
bzip2 Packages
echo "DONE!"
echo "============================="