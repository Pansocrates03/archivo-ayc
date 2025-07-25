<script lang="ts">
  import * as pdfjs from 'pdfjs-dist';
  import { onDestroy, tick } from 'svelte';

  export let url;
  export let data = null;
  export let scale = 1.8;
  export let pageNum = 1;
  export let showButtons = [
    'navigation',
    'zoom',
    'print',
    'rotate',
    'download',
    'autoflip',
    'timeInfo',
    'pageInfo',
  ];
  export let showBorder = true;
  export let totalPage = 0;
  export let showTopButton = true;
  export let onProgress: Function | undefined = undefined;
  export let maxHeight: number = 0;

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  let canvas: HTMLCanvasElement;
  let currentPage = 1;
  let pageCount = 0;
  let pdfDoc: any = null;
  let pageRendering = false;
  let pageNumPending: any = null;
  let rotation = 0;
  let interval: any;
  let secondInterval: any;
  let pages: any = [];
  let password = '';
  let passwordError = false;
  let passwordMessage = '';
  let isInitialized = false;
  let containerWidth = 0;
  let internalScale = 1;

  const renderPage = async (num: number) => {
    if (num < 1 || num > pageCount) return;
    pageRendering = true;
    try {
      const page = await pdfDoc.getPage(num);
      // Calculate viewport scale based on both width and height
      const viewport = page.getViewport({ scale: 1 });
      const scaleX = containerWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      internalScale = Math.min(scaleX, scaleY) || 1;

      const scaledViewport = page.getViewport({ scale: internalScale, rotation });
      const canvasContext = canvas.getContext('2d');
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      const renderContext = {
        canvasContext,
        viewport: scaledViewport,
      };
      await page.render(renderContext).promise;

      pageRendering = false;
      currentPage = num;
      if (pageNumPending !== null) {
        if (pageNum < pdfDoc.numPages) {
          pages[pageNum -1] = canvas.cloneNode(true);
          pageNum++;
          await renderPage(pageNum);
        } else {
            for (let i = 0; i < pages.length; i++) {
                canvas.parentNode?.insertBefore(pages[i], canvas);
            }
            canvas.remove();
        }
        pageNumPending = null;
      }
      // Update page counters
      showButtons.length ? (pageNum = num) : null;
    } catch (error) {
      console.log("Error rendering page:", error);
      pageRendering = false;
    }
  };



  const onPasswordSubmit = () => {
    initialLoad();
  };

  // Calculate reading time based on content length
  const initialLoad = async () => {
    try {
      const params: { url?: string; data?: any; password?: string } = {};
      if (url) params.url = url;
      if (data) params.data = data;
      if (password) params.password = password;

      const loadingTask = pdfjs.getDocument(params);
      if (onProgress) {
        loadingTask.onProgress = onProgress;
      }

      pdfDoc = await loadingTask.promise;
      passwordError = false;
      await tick();

      pageCount = pdfDoc.numPages;
      totalPage = pdfDoc.numPages;

      isInitialized = true;

      // Get the first page to calculate initial scale
      const firstPage = await pdfDoc.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 }); // Get original size
      const scaleX = containerWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      internalScale = Math.min(scaleX, scaleY) || 1;

      renderPage(currentPage);
    } catch (error:any) {
      passwordError = true;
      passwordMessage = error.message;
    }
  };

  initialLoad();

  $: if (containerWidth && pdfDoc && maxHeight) {
    pdfDoc.getPage(1).then((page: any) => {
      const viewport = page.getViewport({ scale: 1 });
      const scaleX = containerWidth / viewport.width;
      const scaleY = maxHeight / viewport.height;
      internalScale = Math.min(scaleX, scaleY) || 1;
      renderPage(currentPage);
    });
  }

  // $: if (isInitialized) queueRenderPage(pageNum);



  onDestroy(() => {
    clearInterval(interval);
    clearInterval(secondInterval);
  });

  let pageWidth: any;
  let pageHeight: any;
</script>

<svelte:window bind:innerWidth={pageWidth} bind:innerHeight={pageHeight} />

<div class="parent">
  <div class={showBorder === true ? 'control' : 'null'}>
    {#if passwordError === true}
      <div class="password-viewer">
        <p>This document requires a password to open:</p>
        <p class="password-message">{passwordMessage}</p>
        <div class="password-container">
          <input type="password" class="password-input" bind:value={password} />
          <button on:click={onPasswordSubmit} class="password-button">
            Submit
          </button>
        </div>
      </div>
    {:else if showButtons.length}
      <div class="control-start">
        <div class={showBorder === true ? 'viewer' : 'null'}>
          <div bind:clientWidth={containerWidth} style="width: 100%;">
            <canvas bind:this={canvas}></canvas>
          </div>
        </div>
      </div>
    {:else}
      <div class={showBorder === true ? 'viewer' : 'null'}>
        <div bind:clientWidth={containerWidth} style="width: 100%;">
          <canvas bind:this={canvas}></canvas>
        </div>
        <!-- width={window.innerWidth} -->
        <!-- height={window.innerHeight}  -->
      </div>
    {/if}
  </div>
  {#if showTopButton}
    <button id="topBtn" on:click={() => window.scrollTo(0, 0)} aria-label="Back to Top">
      <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M7 10v8h6v-8h5l-8-8-8 8h5z" />
      </svg>
    </button>
  {/if}
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .parent {
    display: flex;
    flex-direction: column;
  }

  .password-viewer {
    border-width: 1px;
    border-color: #000;
    border-style: solid;
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    widows: 100%;
  }

  .password-message {
    color: red;
    margin: 8px 0px;
  }

  .password-container {
    align-items: center;
    display: flex;
    justify-content: center;
    margin: 8px 0px;
  }

  .password-input {
    border: 1px solid rgba(0, 0, 0, 0.2);
    padding: 8px;
    width: 200px;
  }

  .password-button {
    background-color: rgb(53, 126, 221);
    border: 1px solid rgba(0, 0, 0, 0.2);
    color: rgb(255, 255, 255);
    border-left-color: transparent;
    cursor: pointer;
    padding: 8px 16px;
  }

  .control {
    margin-top: 1.25rem;
    margin-bottom: 0;
    margin-right: 2.5rem;
    margin-left: 2.5rem;
    border-radius: 0.25rem;
    overflow: auto;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    background-color: #fff;
    border-width: 1px;
  }

  .control-start {
    padding: 1.25rem;
  }

  .viewer {
    border-width: 1px;
    border-color: #000;
    border-style: solid;
  }

  .icon {
    height: 1.25rem;
    width: 1.25rem;
    fill: currentColor;
    color: #38b2ac;
  }

#topBtn {
    position: fixed;
    bottom: 10px;
    float: right;
    right: 10%;
    left: 90%;
    max-width: 30px;
    width: 100%;
    border-color: #000;
    background-color: #fff;
    padding: 0.5px;
    border-radius: 9999px;
  }

#topBtn:hover {
    background-color: #000;
    color: #fff;
  }

  /* 
    ##Device = Tablets, Ipads (portrait)
    ##Screen = B/w 768px to 1024px
    */

  @media (min-width: 768px) and (max-width: 1024px) {
    .parent {
      margin: 0;
    }

    .control {
      margin: 0;
    }

    .control-start {
      padding: 0;
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  }

  /* 
    ##Device = Low Resolution Tablets, Mobiles (Landscape)
    ##Screen = B/w 481px to 767px
    */

  @media (min-width: 481px) and (max-width: 767px) {
    .parent {
      margin: 0;
    }

    .control {
      margin: 0;
    }

    .control-start {
      padding: 0;
    }

    canvas {
      width: 100%;
      height: 100%;
    }
  }

  /* 
    ##Device = Most of the Smartphones Mobiles (Portrait)
    ##Screen = B/w 320px to 479px
    */

  @media (min-width: 320px) and (max-width: 480px) {
    .parent {
      margin: 0;
    }

    .control {
      margin: 0;
    }

    .control-start {
      padding: 0;
    }


    canvas {
      width: 100%;
      height: 100%;
    }
  }

  :global(.pdf-link-overlay) {
    cursor: pointer;
    text-decoration: none;
  }
  
  :global(.pdf-link-overlay:hover) {
    background-color: rgba(0, 123, 255, 0.1) !important;
  }
</style>