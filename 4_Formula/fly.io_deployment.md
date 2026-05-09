cd 5_Symbols
doppler run -- flyctl deploy

---




    0.0s
 => => extracting sha256:4a8b0b2a5b1937755263ac7ac4ee26db2906c13a5d70f1fb1875ba8e370cdd8f                          0.0s
 => => extracting sha256:612c0c1df4c55a0bf145f84df03cb28de505e6a52fb8e49c9da7b143fc00ad2d                          0.4s
 => [internal] load build context                                                                                 15.4s
 => => transferring context: 7.33MB                                                                               15.4s
 => [2/3] COPY nginx.conf /etc/nginx/conf.d/default.conf                                                           0.3s
 => [3/3] COPY public /usr/share/nginx/html                                                                        0.1s
 => exporting to image                                                                                            12.9s
 => => exporting layers                                                                                            1.9s
 => => exporting manifest sha256:269558b9cef430c80e9d3ea698c3f5cd6b3a9d44e2272b941f06bb3731360ffb                  0.0s
 => => exporting config sha256:c6cef3539d8f775eeef6e107e0e65bae3a05b8d22a8fa90f0263fce08c85497c                    0.0s
 => => pushing layers for registry.fly.io/cvs:deployment-01KPEEP9KNC8VC42Q3DJYVJVY3@sha256:269558b9cef430c80e9d3  10.9s
 => => pushing layer sha256:c6cef3539d8f775eeef6e107e0e65bae3a05b8d22a8fa90f0263fce08c85497c                      10.8s
 => => pushing layer sha256:d61f1893691cb616fe31a8616b8d28b171184ac9f8af3773d73a7090d2878a9a                      10.9s
 => => pushing layer sha256:6a66f694c20f32935bd8bcdbd0e5834cdfdc573a9db740ed402eaf72556a2052                      10.7s
 => => pushing layer sha256:9710a0e19ea39ebc6b64a70fff8029520c18f24d5349f10b4d7db8f4ddac0251                      10.7s
 => => pushing layer sha256:10d6b2ac0793a8d947436fc7a6e0856a2e33c4d27083408678a793d87ce1b737                       0.7s
 => => pushing layer sha256:2303f77cd8d540c64ec45a33299e864d4436c36fceaadf3b9f168e1848624fcb                      10.7s
 => => pushing layer sha256:3265682078168dae83460adf790b295dd5794426a82c54de1aec1bf282d45e16                      10.7s
 => => pushing layer sha256:11835c521b13a3dba785aa0a0be3309f47abeb1f7c7273b3250af8b13d45bb97                      10.7s
 => => pushing layer sha256:26a8e95fd6a410165e295338d8426b20bdab29efb335348289568880a707033b                      10.7s
 => => pushing layer sha256:c27b032187bb32262980c3ea6f92adfee16762db4b74f9d96a2f254f98440fe2                      10.8s
 => => pushing layer sha256:4b0509c947003be1323a5a38977845d73b4980e37144df3290035d51059ccb48                      10.7s
 => => pushing manifest for registry.fly.io/cvs:deployment-01KPEEP9KNC8VC42Q3DJYVJVY3@sha256:269558b9cef430c80e9d  0.1s
--> Build Summary:  ()
--> Building image done
image: registry.fly.io/cvs:deployment-01KPEEP9KNC8VC42Q3DJYVJVY3
image size: 26 MB

Watch your deployment at https://fly.io/apps/cvs/monitoring

Provisioning ips for cvs
  Dedicated ipv6: 2a09:8280:1::104:fd32:0
  Shared ipv4: 66.241.125.239
  Add a dedicated ipv4 with: fly ips allocate-v4

This deployment will:

* create 2 "app" machines

No machines in group app, launching a new machine
Creating a second machine for high availability and zero downtime deployments.
To disable this, set "min_machines_running = 0" in your fly.toml.
Finished launching new machines
-------------------------------

 ✔ Machine e82949dfd74dd8 [app] update finished: success
NOTE: The machines for [app] have services with 'auto_stop_machines = "stop"' that will be stopped when idling

---

Checking DNS configuration for cvs.fly.dev
✓ DNS configuration verified

════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

    %%@
                                               @%%@
                                                @@
                                                @@
                                                @@
                                               @@
                      %%#**=+%%%%              @@
                  %#+====-     =*+*%%         @@@
               %#+======-        :+==#%       @@
              %*========.          -+==*%    @@@
            %#+========-             *==+%   @@@
            #*=========.              ++=+% @@@
           %#+========+               .*==*%@@@
           %#=========+     ..    ..-..=*=+%@@
           %#=========+.  :: :     ..   *=+%@
           %#+========+:            .:  #=+#
           %%%#+======+=             .=:*=+#
           @@%+=======++.           :=-++=+%
           @@%#++======+-       :--=*. #==*%
          @@  %#*++====++:      .+#*- ++=*%
         @@    @%#*+++++*+.          +*=*%
        @@       @%*****+*=         +*+#%
       @@@         @%#****#:       +*+%@
       @@@          @@%%***%.     =**%%
         @@@@@@@@@@@ @@@@#**% ...=##%
                          %##*::+%%@
                           @#%=#%@
                           @@%%@
                          %%#%%@
                        %##**+#*%
                        ##**+*#*%
                         %%***#%@

🎉  SUCCESS! Your app is live and ready to use!  🎉

Visit: https://cvs.fly.dev/

════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════

rifaterdemsahin@Rifats-MacBook-Pro-2423 cvs %

* History restored

rifaterdemsahin@Rifats-MacBook-Pro-2607 cvs % cd 5_Symbols
doppler run -- flyctl deploy

cd: no such file or directory: 5_Symbols
==> Verifying app config
Validating /Users/rifaterdemsahin/projects/CVLauncher/5_Symbols/cvs/fly.toml
✓ Configuration is valid
--> Verified app config
==> Building image
==> Building image with Depot
