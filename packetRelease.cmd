@REM rmdir /Q /S Release\

mkdir Release\
mkdir Release\FakePlayerManager
mkdir Release\FakePlayerManager\Language

xcopy /Y FakePlayerManager.* Release\
xcopy /Y FakePlayerManager\*.js Release\FakePlayerManager\
xcopy /Y /E FakePlayerManager\Language Release\FakePlayerManager\Language\

cd Release
7z a -y -tzip FakePlayerManager.zip * -xr!FakePlayerManager*.zip
cd ..

pause