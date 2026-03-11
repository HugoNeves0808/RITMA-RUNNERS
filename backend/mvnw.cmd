@ECHO OFF
SETLOCAL

SET "BASE_DIR=%~dp0"
SET "WRAPPER_DIR=%BASE_DIR%.mvn\wrapper"
SET "PROPS_FILE=%WRAPPER_DIR%\maven-wrapper.properties"

IF NOT EXIST "%PROPS_FILE%" (
  ECHO Missing %PROPS_FILE%
  EXIT /B 1
)

FOR /F "usebackq tokens=1,* delims==" %%A IN ("%PROPS_FILE%") DO (
  IF "%%A"=="distributionUrl" SET "DISTRIBUTION_URL=%%B"
  IF "%%A"=="distributionSha512Sum" SET "DISTRIBUTION_SHA512=%%B"
)

IF "%DISTRIBUTION_URL%"=="" (
  ECHO distributionUrl is missing in %PROPS_FILE%
  EXIT /B 1
)

FOR %%I IN ("%DISTRIBUTION_URL%") DO SET "ZIP_NAME=%%~nxI"
SET "MAVEN_VERSION=%ZIP_NAME:apache-maven-=%"
SET "MAVEN_VERSION=%MAVEN_VERSION:-bin.zip=%"
SET "MAVEN_HOME=%BASE_DIR%.mvn\apache-maven-%MAVEN_VERSION%"
SET "MAVEN_BIN=%MAVEN_HOME%\bin\mvn.cmd"

IF EXIST "%MAVEN_BIN%" GOTO RUN_MAVEN

IF NOT EXIST "%WRAPPER_DIR%" MKDIR "%WRAPPER_DIR%"

SET "DOWNLOAD_ZIP=%WRAPPER_DIR%\%ZIP_NAME%"

ECHO Downloading Maven %MAVEN_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%DOWNLOAD_ZIP%';" ^
  "if ('%DISTRIBUTION_SHA512%' -ne '') {" ^
  "  $actual=(Get-FileHash '%DOWNLOAD_ZIP%' -Algorithm SHA512).Hash.ToLower();" ^
  "  if ($actual -ne '%DISTRIBUTION_SHA512%'.ToLower()) {" ^
  "    throw 'SHA-512 mismatch while downloading Maven distribution.'" ^
  "  }" ^
  "}" ^
  "Expand-Archive -Path '%DOWNLOAD_ZIP%' -DestinationPath '%BASE_DIR%.mvn' -Force;"
IF ERRORLEVEL 1 EXIT /B 1

:RUN_MAVEN
CALL "%MAVEN_BIN%" %*
EXIT /B %ERRORLEVEL%
