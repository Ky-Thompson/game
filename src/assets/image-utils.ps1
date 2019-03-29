$LastLocation = Get-Location
Set-Location (Split-Path $MyInvocation.MyCommand.Path)

# Resizes all images to 200%
Get-ChildItem . -Filter *.png -Recurse | ForEach-Object {
    $Image = $_
    Write-Host $Image.FullName
    convert $Image.FullName -interpolate Integer -filter point -resize 200% $Image.FullName
}

Set-Location $LastLocation