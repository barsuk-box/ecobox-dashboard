import React, { useEffect, useRef, useState } from "react";
export default function Assembly({ paused = false }) {
  const host = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false,
      renderer,
      observer,
      frame,
      model,
      mixer;
    let cleanup = () => {};
    const container = host.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) {
      setReady(false);
      return;
    }
    Promise.all([import("three"), import("three/addons/loaders/GLTFLoader.js")])
      .then(([T, { GLTFLoader }]) => {
        if (disposed) return;
        try {
          renderer = new T.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "low-power",
          });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
        renderer.outputColorSpace = T.SRGBColorSpace;
        renderer.setClearColor(0, 0);
        container.appendChild(renderer.domElement);
        const scene = new T.Scene();
        const camera = new T.PerspectiveCamera(33, 1, 0.1, 100);
        camera.position.set(3.7, 2.9, 5.4);
        camera.lookAt(0, 0, 0);
        scene.add(new T.HemisphereLight(0xddefff, 0x53739a, 3));
        const key = new T.DirectionalLight(0xffffff, 5);
        key.position.set(3, 5, 5);
        scene.add(key);
        const rim = new T.DirectionalLight(0x4285ff, 5);
        rim.position.set(-3, 0, 2);
        scene.add(rim);
        const teal = new T.DirectionalLight(0x44ffdd, 3);
        teal.position.set(3, 0, -2);
        scene.add(teal);
        let visible = true,
          px = 0,
          py = 0,
          scroll = 0;
        const resize = () => {
          let w = container.clientWidth,
            h = container.clientHeight;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        resize();
        observer = new IntersectionObserver((e) => {
          visible = e[0].isIntersecting;
        });
        observer.observe(container);
        const pointer = (e) => {
          const r = container.getBoundingClientRect();
          px = (e.clientX - r.left) / r.width - 0.5;
          py = (e.clientY - r.top) / r.height - 0.5;
        };
        const onScroll = () => {
          scroll = Math.min(window.scrollY, 700) / 700;
        };
        container.addEventListener("pointermove", pointer);
        window.addEventListener("scroll", onScroll, { passive: true });
        cleanup = () => {
          ro.disconnect();
          container.removeEventListener("pointermove", pointer);
          window.removeEventListener("scroll", onScroll);
        };
        new GLTFLoader().load(
          import.meta.env.BASE_URL + "models/ecobox-assembly.glb",
          (g) => {
            if (disposed) {
              g.scene.traverse((o) => {
                o.geometry?.dispose();
                if (o.material) o.material.dispose();
              });
              return;
            }
            model = g.scene;
            scene.add(model);
            if (g.animations.length) {
              mixer = new T.AnimationMixer(model);
              g.animations.forEach((a) => mixer.clipAction(a).play());
            }
            setReady(true);
          },
          undefined,
          () => {},
        );
        let last = performance.now();
        const tick = (now) => {
          if (disposed) return;
          frame = requestAnimationFrame(tick);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (!visible || document.hidden) return;
          if (model) {
            model.rotation.y +=
              (px * 0.25 + scroll * 0.18 - model.rotation.y) * 0.035;
            model.rotation.x += (py * 0.12 - model.rotation.x) * 0.035;
            model.position.y = Math.sin(now * 0.00065) * 0.045 - scroll * 0.1;
          }
          mixer?.update(dt * 0.5);
          renderer.render(scene, camera);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      cleanup();
      model?.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [paused]);
  return (
    <div className="assembly" ref={host} aria-hidden="true">
      <img
        className={ready ? "poster loaded" : "poster"}
        src={import.meta.env.BASE_URL + "models/assembly-poster.png"}
        alt=""
      />
      <div className="orbit orbit-a" />
      <div className="orbit orbit-b" />
    </div>
  );
}
