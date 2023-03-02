---
title: How to authenticate with Kerberos using .NET
description: Tips and tricks on how to authenticate with Kerberos using .NET
tags: [dotnet, webdev, linux, csharp]
date: "2023-03-02 12:00:00"
---

Recently, I have had the not-so-easy task to authenticate some API calls using the Kerberos method authentication. After a while of reading some docs and digging stack overflow about this subject, I decided to post a summary of what I have discovered. 

First of all, hope that your infrastructure is all set up within the same network and all SPNs are configured. Having this set up correctly will prevent you from some headaches when things go wrong, even if your code is correct. 

If you are using Windows as your environment and your server is within the same network as the Kerberos Authentication Server you should be able to easily authenticate using the default credentials or passing the username and password using the Network Credentials class of .NET inside your HttpClientHandler when you configure your HttpClient. Make sure your server is added to the Active Directory that manages the authentication. 

To authenticate using custom credentials you can use the following code inside your ConfigureServices method:
```csharp
services.AddHttpClient<IConnector, Connector>().ConfigurePrimaryHttpMessageHandler(
      serviceProvider =>
            {
                var credentialsCache = new CredentialCache {
                    { new Uri("https://yoururl.com/endpoint"),
                      "Negotiate",
                      new NetworkCredential("USERACCOUNT", "PASSWORD", "DOMAIN")
                    }
                };

                var httpClientHandler = new HttpClientHandler {
                    UseProxy = false,
                    Credentials = credentialsCache,
                    UseDefaultCredentials = false,
                };
                return httpClientHandler;
            });
```
The above code should work fine both in Linux and Windows when doing a request to an endpoint that accepts the Kerberos authentication. 

If you want to use the default credentials of your server, and you already have that set up in your environment you can use the following code inside your ConfigureServices method:
```csharp
services.AddHttpClient<IConnector, Connector>().ConfigurePrimaryHttpMessageHandler(
   serviceProvider =>
            {
                var httpClientHandler = new HttpClientHandler {
                    UseProxy = false,
                    UseDefaultCredentials = true
                };
                return httpClientHandler;
            });
```

To get the above code working on Linux, you first need to configure the Kerberos tickets inside your server. To do that you should have the Kerberos configuration file, usually called krb5.conf file. Read more on [Krb5.conf file](https://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html). In addition to the configuration file, you need to have some libraries installed in your server: krb5-config, krb5-user, syslog-ng realmd, gss-ntlmssp. After you have all set up you should initialize your ticket using the kinit command, read more on [kinit command](https://web.mit.edu/kerberos/krb5-1.12/doc/user/user_commands/kinit.html). 

Command example:
```
kinit -V keytabfile.keytab account@domain.com
```
You can check your tickets running this other command:
```
klist
```

After configuring it, you should be able to make a standard request using your HttpClient and .NET will add the Negotiate header with your Kerberos ticket. Hopefully, if the service you are calling is configured correctly, this should work. 

All the above code uses the default built in HttpClient provided by .NET. Alternatively, you can try to authenticate with this great library called Kerberos.NET, read more on [Kerberos.NET](https://github.com/dotnet/Kerberos.NET). 

Also, you can try to execute a direct call inside your Linux server using curl to check if everything is right with the configuration of your Kerberos credentials and tickets. To run a curl command using the Kerberos tickets use this syntax:
```
curl -k --negotiate -u : -X --location --request <VERB> <URL>
```

Additionally, if you want to add the functionality of authorization and authentication with Kerberos or windows AD in a Linux environment you need to add a package in your project from Nuget, and add the following code to your Startup.cs :

- package to install:  Microsoft.AspNetCore.Authentication.Negotiate

```csharp
public void ConfigureServices(IServiceCollection services) {
   services.AddAuthentication(NegotiateDefaults.AuthenticationScheme)
      .AddNegotiate();
   
   builder.Services.AddAuthorization(options =>
   {
       options.FallbackPolicy = options.DefaultPolicy;
   });
   // code continues
}

public void Configure(IApplicationBuilder app) {
   // code before
   app.UseAuthentication();
   app.UseAuthorization();
   // code continues
}
```


Hope that helps someone who is trying to authenticate with Kerberos using .NET!

Additional resources:
- [Configure Windows Authentication in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/windowsauth?view=aspnetcore-7.0&tabs=visual-studio)
- [Kerberos.NET library](https://github.com/dotnet/Kerberos.NET)
- [Kerberos documentation](https://kerberos.net/docs/index.html)