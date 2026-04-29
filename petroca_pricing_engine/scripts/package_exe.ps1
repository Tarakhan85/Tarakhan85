param(
  [string]$EntryPoint = "app/main.py",
  [string]$Name = "PETROCAFPricingEngine"
)

python -m pip install pyinstaller
pyinstaller --noconfirm --windowed --name $Name $EntryPoint
Write-Host "Build completed. Check .\\dist\\$Name"
