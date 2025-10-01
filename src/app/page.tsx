// src/app/page.tsx
"use client"; // 关键：声明为客户端组件

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 使用别名导入组件
import MapComponent from '@/components/MapComponent';

// 图片资源现在是字符串路径，不再需要 import

// 魔方页面悬浮文字组件
const FloatingText: React.FC<{
    targetSectionId: string;
    lines: string[];
}> = ({ targetSectionId, lines }) => {

    const floatingRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const [scrollY, setScrollY] = useState(0);

    // 初始化目标元素引用
    useEffect(() => {
        targetRef.current = document.getElementById(targetSectionId) as HTMLDivElement;
        handlePositionUpdate();
    }, [targetSectionId]);

    // 监听滚动事件
    useEffect(() => {
        const handleScroll = () => {
            requestAnimationFrame(() => setScrollY(window.scrollY));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 处理位置更新
    const handlePositionUpdate = () => {
        const floatingEl = floatingRef.current;
        const targetEl = targetRef.current;
        if (!floatingEl || !targetEl) return;

        const targetRect = targetEl.getBoundingClientRect();
        const targetTop = targetRect.top + window.scrollY;
        const targetBottom = targetTop + targetRect.height;
        const floatingHeight = floatingEl.offsetHeight || lines.length * 30; // 动态计算高度
        const stopOffset = targetRect.height - floatingHeight - 20;
        const currentScroll = scrollY;
        const scrollInTarget = currentScroll - targetTop;

        floatingEl.style.position = '';
        floatingEl.style.top = '';
        floatingEl.style.left = '';

        if (currentScroll < targetTop) {
            floatingEl.style.position = 'absolute';
            floatingEl.style.top = '20px';
            floatingEl.style.left = '20px';
        } else if (currentScroll >= targetTop && currentScroll < targetBottom - floatingHeight) {
            if (scrollInTarget < stopOffset) {
                floatingEl.style.position = 'fixed';
                floatingEl.style.top = '20px';
                floatingEl.style.left = `${targetRect.left + 20}px`;
            } else {
                floatingEl.style.position = 'absolute';
                floatingEl.style.top = `${stopOffset}px`;
                floatingEl.style.left = '20px';
            }
        } else {
            floatingEl.style.position = 'absolute';
            floatingEl.style.top = `${stopOffset}px`;
            floatingEl.style.left = '20px';
        }
    };

    // 滚动和窗口大小变化时更新位置
    useEffect(() => {
        handlePositionUpdate();
    }, [scrollY, lines]); // 当文字内容变化时重新计算

    useEffect(() => {
        const handleResize = () => handlePositionUpdate();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [lines]);

    return (
        <div
            ref={floatingRef}
            style={{
                pointerEvents: 'none',
                zIndex: 100,
                lineHeight: 1.6, // 行高
            }}
        >
            {lines.map((line, index) => (
                // 用React.Fragment包裹每行和换行符（最后一行不需要换行）
                <React.Fragment key={index}>
          <span
              style={{
                  color: 'white',
                  fontWeight: 200,
                  // 奇数行（index从0开始，所以用index % 2 === 0判断）使用字体A
                  // 偶数行使用字体B
                  fontFamily: index % 2 === 0
                      ? 'ke, sans-serif'  // 奇数行字体
                      : 'serif, helvetica',  // 偶数行字体
                  fontSize: index % 2 === 0
                      ? '2rem'  // 奇数行字大小
                      : '1.5rem',  // 偶数行字大小
              }}
          >
            {line}
          </span>
                    {/* 最后一行不添加换行 */}
                    {index !== lines.length - 1 && <br />}
                </React.Fragment>
            ))}
        </div>
    );
};


export default function Home() {
    const rubiksCubeRef = useRef<HTMLDivElement>(null);
    const rubiksCubeAppRef = useRef<any>(null);
    const [literatureShifted, setLiteratureShifted] = useState(false);
    const [designShifted, setDesignShifted] = useState(false);
    const [aiShifted, setAiShifted] = useState(false);

    // Rubik's Cube useEffect
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const scrollAnimation = gsap.to(".top-layer", {
            y: "-100%",
            ease: "none",
            scrollTrigger: {
                trigger: ".reveal-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
            },
        });

        const RubiksCubeApp = {
            scene: null as THREE.Scene | null,
            camera: null as THREE.PerspectiveCamera | null,
            renderer: null as THREE.WebGLRenderer | null,
            controls: null as OrbitControls | null,
            composer: null as EffectComposer | null,
            rubiksCube: null as THREE.Group | null,
            cubeletOriginalPositions: [] as THREE.Vector3[],
            animationFrameId: null as number | null,
            container: null as HTMLElement | null,
            boundOnWindowResize: null as (() => void) | null,

            init: function(containerElement: HTMLElement) {
                this.container = containerElement;
                this.scene = new THREE.Scene();

                this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
                this.camera.position.z = 15;
                this.camera.position.y = 5;

                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.container.appendChild(this.renderer.domElement);

                this.controls = new OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.enableZoom = false;

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
                this.scene.add(ambientLight);
                const pointLight = new THREE.PointLight(0xffffff, 1.5, 200);
                pointLight.position.set(10, 15, 10);
                this.scene.add(pointLight);

                this.createRubiksCube();

                const renderScene = new RenderPass(this.scene!, this.camera!);
                const bloomPass = new UnrealBloomPass(new THREE.Vector2(this.container.clientWidth, this.container.clientHeight), 1.5, 0.4, 0.85);
                bloomPass.threshold = 0;
                bloomPass.strength = 0.5;
                bloomPass.radius = 0;

                this.composer = new EffectComposer(this.renderer);
                this.composer.addPass(renderScene);
                this.composer.addPass(bloomPass);

                this.boundOnWindowResize = this.onWindowResize.bind(this);
                window.addEventListener('resize', this.boundOnWindowResize, false);
            },

            createRubiksCube: function() {
                this.rubiksCube = new THREE.Group();
                const cubeSize = 1, spacing = 0.1, N = 3;
                const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.5 });
                const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xeeeeee });

                for (let x = 0; x < N; x++) {
                    for (let y = 0; y < N; y++) {
                        for (let z = 0; z < N; z++) {
                            const cube = new THREE.Mesh(geometry, cubeMaterial.clone());
                            const position = new THREE.Vector3(
                                (x - (N - 1) / 2) * (cubeSize + spacing),
                                (y - (N - 1) / 2) * (cubeSize + spacing),
                                (z - (N - 1) / 2) * (cubeSize + spacing)
                            );
                            cube.position.copy(position);

                            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
                            cube.add(edges);
                            (cube as any).isTwitching = false;
                            this.rubiksCube.add(cube);
                            this.cubeletOriginalPositions.push(position.clone());
                        }
                    }
                }
                this.scene!.add(this.rubiksCube);
            },

            onWindowResize: function() {
                if (!this.container || !this.camera || !this.renderer || !this.composer) return;
                this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                this.composer.setSize(this.container.clientWidth, this.container.clientHeight);
            },

            animate: function() {
                if (!this.rubiksCube || !this.controls || !this.composer) return;
                this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
                const time = Date.now() * 0.001;
                this.rubiksCube.rotation.y += 0.002;

                const breathAmplitude = 0.05, breathSpeed = 2;
                this.rubiksCube.children.forEach((cubelet, i) => {
                    const originalPos = this.cubeletOriginalPositions[i];
                    if (!originalPos) return;
                    const direction = originalPos.clone().normalize();
                    const offset = Math.sin(time * breathSpeed + originalPos.length() * 0.5) * breathAmplitude;
                    cubelet.position.copy(originalPos).add(direction.multiplyScalar(offset));
                });

                if (Math.random() > 0.965) {
                    const randomCubelet = this.rubiksCube.children[Math.floor(Math.random() * this.rubiksCube.children.length)] as THREE.Mesh & { isTwitching?: boolean };
                    if (randomCubelet && !randomCubelet.isTwitching) {
                        randomCubelet.isTwitching = true;
                        gsap.to(randomCubelet.rotation, {
                            x: `+=${(Math.random() - 0.5) * Math.PI * 0.5}`,
                            y: `+=${(Math.random() - 0.5) * Math.PI * 0.5}`,
                            duration: 0.3,
                            ease: 'power2.out',
                            yoyo: true,
                            repeat: 1,
                            onComplete: () => {
                                randomCubelet.rotation.set(0, 0, 0);
                                randomCubelet.isTwitching = false;
                            }
                        });
                    }
                }

                this.controls.update();
                this.composer.render();
            },

            start: function() {
                if (!this.animationFrameId) this.animate();
            },

            stop: function() {
                if (this.animationFrameId) {
                    cancelAnimationFrame(this.animationFrameId);
                    this.animationFrameId = null;
                }
            }
        };
        const cubeContainer = rubiksCubeRef.current;
        if (cubeContainer) {
            RubiksCubeApp.init(cubeContainer);
            rubiksCubeAppRef.current = RubiksCubeApp;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        rubiksCubeAppRef.current?.start();
                    } else {
                        rubiksCubeAppRef.current?.stop();
                    }
                });
            }, { threshold: 0.01 });

            observer.observe(cubeContainer);

            return () => {
                scrollAnimation.kill();
                observer.disconnect();
                rubiksCubeAppRef.current?.stop();

                if (rubiksCubeAppRef.current?.boundOnWindowResize) {
                    window.removeEventListener('resize', rubiksCubeAppRef.current.boundOnWindowResize);
                }

                if (cubeContainer && rubiksCubeAppRef.current?.renderer) {
                    if (cubeContainer.contains(rubiksCubeAppRef.current.renderer.domElement)) {
                        cubeContainer.removeChild(rubiksCubeAppRef.current.renderer.domElement);
                    }
                }
            };
        }
    }, []);

    // regarding部分图片左右移动效果
    const handleLiteratureMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        if (mouseX < containerWidth / 2) {
            if (literatureShifted) {
                setLiteratureShifted(false);
            }
        } else {
            if (!literatureShifted) {
                setLiteratureShifted(true);
            }
        }
    };

    const handleDesignMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        if (mouseX < containerWidth / 2) {
            if (!designShifted) {
                setDesignShifted(true);
            }
        } else {
            if (designShifted) {
                setDesignShifted(false);
            }
        }
    };

    const handleAiMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const containerRect = container.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        if (mouseX < containerWidth / 2) {
            if (aiShifted) {
                setAiShifted(false);
            }
        } else {
            if (!aiShifted) {
                setAiShifted(true);
            }
        }
    };

    // JSX 部分，更新图片路径
    return (
        <>
            {/* 三个角落固定悬浮元素 */}
            <div className="fixed-overlay top-right">千丈阴崖百丈溪 孤桐枝上凤偏宜</div>
            <div className="fixed-overlay bottom-left">TO LEARN AND CREATE,<br />FOR A MEANINGFUL LIFE AND A BETTER WORLD</div>
            <div className="fixed-overlay bottom-right">chivalrycieux@qq.com 2025</div>

            <div className="reveal-container">
                <div className="sticky-wrapper">
                    <div className="reveal-layer" id="rubiks-cube-container">
                        <FloatingText
                            targetSectionId="rubiks-cube-container"
                            lines={[
                                "高中就读于遵义航天高级中学",
                                "Attended Zunyi Aerospace Senior High School",
                                "现就读于同济大学",
                                "Currently enrolled in the dual bachelor's degree program",
                                "视觉传达设计与人工智能",
                                "In Visual Communication Design and Artificial Intelligence",
                                "双学士学位项目",
                                "At Tongji University, Shanghai"
                            ]}
                        />
                        <div ref={rubiksCubeRef} className="rubiks-cube-right"></div>
                    </div>
                    <div className="reveal-layer top-layer">
                        <div className="first-page-layout">
                            <div className="first-page-text">
                                <h1>兹暂客</h1>
                            </div>
                            <div className="first-page-image">
                                {/* 更新图片路径 */}
                                <img src="/images/1-1.png" alt="Artwork" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 嵌入地图组件 */}
            <div className="map-section" style={{ width: '100%', height: '100vh' }}>
                <MapComponent />
            </div>

            {/* About Me部分 */}
            <div className="content" id="about-me">
                <h1>About Me</h1>
                <div className="avatar-container">
                    {/* 更新图片路径 */}
                    <img src="/images/avatar.png" alt="Avatar" className="avatar-image" />
                </div>
                <p>“大学之道，在明明德，在亲民，在止于至善。”在我还年幼的时候，我就已经将《大学》的三纲领背得滚瓜烂熟了。我初中的校训摘自论语，叫“君子不器”。孔子以此来说明君子不能像器物一样只有一种功用。我时常以此来告诉自己，人生一世，探求世间的无数真理，格物致知，同时品味不同的人生滋味，修身明德，乃是一种多姿多彩的生活方式，而这样怀揣不同知识与技艺的道德高尚的“君子”也正是一种理想的人格。</p>
            </div>

            <div className="marquee-container">
                <div className="marquee-track">
                    <span>ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ </span>
                    <span>ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ ChivaLry Cieux ★ </span>
                </div>
            </div>

            {/* regarding部分 */}
            <div className="regarding-container" id="regarding-literature" onMouseMove={handleLiteratureMouseMove}>
                {/* 更新图片路径 */}
                <div className={`regarding-background ${literatureShifted ? 'shifted' : ''}`} style={{ backgroundImage: `url(/images/2-1.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="regarding-text">
                    <div className="text-wrapper">
                        <h1>Regarding Literature</h1>
                        <p>I began writing classical Chinese regulated verse at age 13, simultaneously composing and studying texts. My greatest inspirations came from the Book of Songs, Yuefu poetry, and Xin Qiji. Some of my poems have been published. I started studying philosophy in high school, but only after extensive exploration of politics, economics, and history. My philosophical journey began with S.T. Stumpf's thick History of Western Philosophy, progressing all the way to Lacanian psychoanalysis. The spirit of Marx has profoundly influenced me. By university, my prose writing finally broke free from the shackles of established writing styles, as I practiced the principle that "there is no fixed form in writing, with vividness being the most valuable." During moments of inspiration, I even won Tongji University's top literary prize. However, I no longer read poetry, philosophy, or prose. Currently, I am focusing on learning fiction writing.</p>
                    </div>
                </div>
                <div className={`regarding-chinese ${literatureShifted ? 'visible' : ''}`}>
                    <div className="text-wrapper">
                        <h1>关于文学</h1>
                        <p>我13岁开始写中国古典的格律诗，边写边读，最爱《诗经》乐府辛弃疾。诗作偶有发表。高中开始学哲学，但先广泛涉猎政治经济与历史，而后才从斯通普夫厚厚的《西方哲学史》开始，一直学到拉康精神分析。马克思的气概对我影响颇深。到大学之后，散文创作终于打破文风枷锁，躬行"文无定格，贵在鲜活"之道。灵光乍现的时候，也曾得过同济的第一。诗歌、哲学、散文，现在都不读了。现在学习小说。</p>
                    </div>
                </div>
            </div>

            <div className="regarding-container reverse" id="regarding-design" onMouseMove={handleDesignMouseMove}>
                {/* 更新图片路径 */}
                <div className={`regarding-background ${designShifted ? 'shifted' : ''}`} style={{ backgroundImage: `url(/images/2-2.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="regarding-text">
                    <div className="text-wrapper">
                        <h1>Regarding Design</h1>
                        <p>Lacking innate musical talent or foundational fine arts training, I can only progress in design through persistent ideation and practice. While I have created numerous posters in graphic design, most have been ordinary, though I did produce main visuals for several international academic conferences. My video editing skills remain underdeveloped, and creating animations would likely be inefficient. Fortunately, my philosophical background provides theoretical grounding for discussing semiotics and signifiers in design thinking. Game design is currently in my learning phase – its connection with coding particularly fascinates me, and I look forward to exploring this field. As for front-end web design – interactive posters and user-controlled animations – the results of my work are presented here before you.</p>
                    </div>
                </div>
                <div className={`regarding-chinese ${designShifted ? 'visible' : ''}`}>
                    <div className="text-wrapper">
                        <h1>关于设计</h1>
                        <p>鄙人无音韵之天赋，亦无美术之基础，设计一途，只能靠多想多做。平面设计，海报做了不少，大都普普通通，好在曾为几场国际会议做过主视觉。视屏剪辑，学艺不精，要做动画，恐怕效率难以差强人意。设计思维，符号与能指，幸亏有些哲学基础，可供我夸夸其谈。游戏设计尚在学习中。不过其与代码有联系，我也饶有兴趣，大可期待一番。至于前端网页设计——可交互的海报，由你控制的动画——我所做的，就在你眼前了。</p>
                    </div>
                </div>
            </div>

            <div className="regarding-container" id="regarding-ai" onMouseMove={handleAiMouseMove}>
                {/* 更新图片路径 */}
                <div className={`regarding-background ${aiShifted ? 'shifted' : ''}`} style={{ backgroundImage: `url(/images/2-3.jpg)`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                <div className="regarding-text">
                    <div className="text-wrapper">
                        <h1>Regarding Artificial Intelligence</h1>
                        <p> Calculus, linear algebra, and probability theory formed my initial mathematical foundation. Discrete mathematics, signal systems, and optimization theory became essential tools for deeper exploration. Combined with computer science and programming languages, these enabled my entry into machine learning. By integrating matrix multiplication with non-affine functions, I constructed artificial neural networks. Utilizing Gradient Boosting Decision Trees and Multilayer Perceptrons, I have won awards in domestic and international competitions. Later, I expanded into financial machine learning, quantitative finance, blockchain, and Web3 technologies. Future advanced studies remain open for further exploration.</p>
                    </div>
                </div>
                <div className={`regarding-chinese ${aiShifted ? 'visible' : ''}`}>
                    <div className="text-wrapper">
                        <h1>关于人工智能</h1>
                        <p>微积分、线性代数、概率论，都是最开始掌握的基础。离散数学、信号与系统、最优化理论，都是深入其中必须借助的工具。再加上计算机科学与编程语言，就可以进入机器学习的世界。再结合矩阵乘法与非仿射函数，就可以搭建起人工神经网络。借助梯度提升决策树与多层感知机，我也在国内国外各比赛、平台拿过一些奖。后来又涉猎了金融机器学习和量化金融，区块链与Web3。更深入的学习，就交给未来了。</p>
                    </div>
                </div>
            </div>
        </>
    );
}