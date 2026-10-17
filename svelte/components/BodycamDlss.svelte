<script>let {download}=$props();</script>
{#if download}<div class="card bodycam-dlss"><p class="eyebrow">OPTIONAL ENGINE · DX11-AVX</p><h3>Bodycam + DLSS / FSR 3</h3>
<p>Squared Away and Bodycam 0.3 with DLSS, DLAA and FSR 3 Super Resolution. Includes the PiP scope fix, instanced grass and a camera-motion fallback. No frame generation.</p>
<p class="hint">DLSS/DLAA requires an NVIDIA RTX GPU. FSR requires Direct3D feature level 11.1. FPS gains depend on your setup; CPU limits and frame caps can limit the benefit. Tested by Fomok with DLSS and Bodycam scope effects.</p>
<div class="site-actions"><a class="tool primary" href={download.engine.browser_download_url}>Download Bodycam + DLSS engine</a><a class="tool" href={download.gamma.browser_download_url}>Bodycam GAMMA Patch 1.1.0</a><a class="tool" href={download.shaders.browser_download_url}>Required shader compatibility patch</a></div>
<details><summary>How to install</summary><ol>
<li>Close the game and back up your engine files. Install the ZIP’s bin and db/mods together into Anomaly, replacing your current engine. Keep Squared Away installed.</li>
<li>For GAMMA, install Bodycam GAMMA Patch 1.1.0 through MO2. Install our shader compatibility patch below Bodycam, SSS and Atmospherics so it wins conflicts. Select your actual Atmospherics version and Wearable Devices only if installed. This shader pack requires SSS 23.5.</li>
<li>Disable older DLSS/FSR compatibility patches, including the patch from the other Bodycam merge. Replace earlier versions of our shader patch.</li>
<li>Clear the shader cache through the launcher, keep MSAA off, then choose DLSS or FSR and a quality level in Video settings. Reload the level after installing the grass shaders.</li>
</ol><p class="hint">To compare the camera-motion fallback, use r__upscaler_camera_mv 0 (off) or 1 (on, default). This download uses standard Bodycam handling, without the personal weapon-follow or pivot changes. To revert, restore your backed-up engine and previous shader setup, then clear the shader cache.</p></details>
</div>{/if}
