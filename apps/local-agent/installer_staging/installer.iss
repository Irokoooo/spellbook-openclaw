; SpellBook Agent Installer for Windows
; Inno Setup 6+ script

#define MyAppName "SpellBook Agent"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SpellBook"
#define MyAppURL "https://www.spellb00k.me"
#define MyAppExeName "spellbook-agent.exe"

[Setup]
AppId={{FE8A6A1B-9C3D-4F8E-9B2D-7A1E5C3F8D6B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\SpellBook Agent
DefaultGroupName=SpellBook
AllowNoIcons=yes
OutputDir=.\output
OutputBaseFilename=SpellBook_Agent_Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableDirPage=no
DisableProgramGroupPage=yes
UninstallDisplayIcon={app}\spellbook-agent.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
Source: "spellbook-agent.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "_run_loop.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "install_autostart.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "setup.bat"; DestDir: "{app}"; Flags: isreadme

[Dirs]
Name: "{app}\data"

[Icons]
Name: "{group}\SpellBook Agent (auto-restart)"; Filename: "{app}\_run_loop.bat"; WorkingDir: "{app}"
Name: "{group}\SpellBook Agent (single run)"; Filename: "{app}\spellbook-agent.exe"; WorkingDir: "{app}"
Name: "{group}\Configuration Helper"; Filename: "{app}\setup.bat"; WorkingDir: "{app}"
Name: "{group}\Install Auto-Start"; Filename: "{app}\install_autostart.bat"; WorkingDir: "{app}"
Name: "{group}\Uninstall SpellBook Agent"; Filename: "{uninstallexe}"
Name: "{commondesktop}\SpellBook Agent"; Filename: "{app}\_run_loop.bat"; WorkingDir: "{app}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Shortcuts:"
Name: "autostart"; Description: "Register Windows auto-start (recommended)"; GroupDescription: "Startup options:"
Name: "startagent"; Description: "Start Agent after installation"; GroupDescription: "Startup options:"

[Run]
; Step 1: Try auto-installing openclaw if not present
Filename: "{cmd}"; Parameters: "/C where openclaw >nul 2>&1 || npm install -g openclaw"; WorkingDir: "{app}"; Flags: runhidden; Description: "Auto-installing OpenClaw (if needed)..."
; Step 2: Register auto-start (optional)
Filename: "{app}\install_autostart.bat"; Parameters: ""; WorkingDir: "{app}"; Flags: runhidden; Tasks: autostart
; Step 3: Configuration assistant (user interaction)
Filename: "{app}\setup.bat"; Parameters: ""; WorkingDir: "{app}"; Flags: nowait shellexec; Description: "Configure Agent (enter Agent ID)"
; Step 4: Start agent (optional)
Filename: "{app}\_run_loop.bat"; Parameters: ""; WorkingDir: "{app}"; Flags: nowait; Tasks: startagent

