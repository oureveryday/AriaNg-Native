If Not WScript.Arguments.Named.Exists("elevate") Then
  CreateObject("Shell.Application").ShellExecute WScript.FullName _
    , """" & WScript.ScriptFullName & """ /elevate", "", "runas", 1
  WScript.Quit
End If
Set fso = CreateObject("Scripting.FileSystemObject")
GetTheParent = fso.GetParentFolderName(Wscript.ScriptFullName)
Set objShell = WScript.CreateObject("WScript.Shell")
objShell.CurrentDirectory=GetTheParent
Set oExec = objShell.Exec("AriaNg Native.exe")
objShell.CurrentDirectory = "resources\aria2"
ID=CStr(oExec.ProcessID)
objShell.Run "aria2c.exe --conf-path=aria2.conf --stop-with-process="&ID,0
objShell.Run "wmic process where name='aria2c.exe' call SetPriority ""Realtime"""