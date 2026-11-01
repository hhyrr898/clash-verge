---
noindex: true
layout: layouts/post.njk
title: "Clash Verge TUN 模式配置指南：服务模式与虚拟网卡"
description: "本文以 Clash Verge Rev v2.4.2 为例，手把手教你配置 TUN 模式：从安装服务模式到验证虚拟网卡，包含四步操作指南和三个常见问题解答，并分享我遇到的两个坑。"
date: 2026-11-01
featured: true
category: "使用教程"
tags: ["posts", "教程", "SSH连接"]
permalink: /blog/clash-verge-tun-mode-guide/
---

上个月我将 Clash Verge 更新至 Rev v2.4.2（2025 年 3 月发布），遇到了系统代理模式与游戏加速器冲突的问题。转向 TUN 模式是有效的解决方案，它通过虚拟网卡在更底层接管所有 TCP/UDP 流量，避免了代理冲突。

这篇指南将记录下完整的配置过程，重点讲解服务模式的设置。阅读后，你将能亲手开启 Clash Verge 的 TUN 模式，解决类似的应用兼容性问题，并理解其背后的工作原理。

需要提前说明：Clash Verge Rev 使用的是 mihomo（原 Clash.Meta）内核，TUN 模式必须依赖系统服务，不是点一下开关就能用的。如果你还没装 Clash Verge，建议先看这篇 [Clash Verge 安装教程](https://example.com/blog/clash-verge-install-windows/)，把基础环境搭好。

## 前置准备：确认内核与服务状态

在动手之前，先确认两件事。第一，打开 Clash Verge 的「设置」→「内核」页面，看看内核版本是不是 mihomo。第二，去「服务模式」那一栏，如果显示「未安装」，说明系统服务还没装。

我第一次操作时忽略了这一步，直接开 TUN 模式，结果日志里一直报 `TUN 启动失败: 找不到服务`。后来查了 [mihomo 内核说明](https://example.com/blog/clash-verge-mihomo-kernel/) 才明白，TUN 模式需要以管理员权限安装一个后台服务，用来创建虚拟网卡并修改路由表。

### 安装服务模式（必做）

1. 在 Clash Verge 主界面点击左侧「设置」，找到「服务模式」区域。
2. 点击「安装服务」按钮，Windows 会弹出 UAC 提权窗口，点「是」。
3. 等待进度条走完，状态变成「已安装」且显示「服务运行中」即可。

这里有个小坑：如果你之前装过旧版服务，升级 Clash Verge 后可能需要先点「卸载服务」再重新安装，否则 TUN 模式会提示版本不匹配。我就在这一步卡了一会儿，后来在 [备份配置](https://example.com/blog/clash-verge-backup-config/) 页面看到类似提醒，才想起来要重装。

## 四步开启 TUN 模式

服务装好之后，配置 TUN 模式本身其实很快。以下是我在 v2.4.2 上的实际操作步骤：

1. **打开 TUN 模式开关**。在「设置」→「TUN 模式」中，把开关拨到开启状态。此时 Clash Verge 会自动调用 mihomo 内核创建虚拟网卡，网卡名称通常叫 `Mihomo` 或 `Clash`。
2. **选择栈类型**。在 TUN 设置里，有一个「栈」选项，默认是 `gVisor`。如果你主要用浏览器和普通应用，保持默认就行；如果遇到某些游戏或 P2P 软件连不上，可以试试切换成 `System` 栈。我平时写代码和看视频，gVisor 完全够用。
3. **配置 DNS 劫持**。TUN 模式下建议开启「DNS 劫持」，并把 DNS 服务器设成 `223.5.5.5` 或你信任的地址。这一步能避免部分应用绕过代理直接走本地 DNS。
4. **验证虚拟网卡**。打开 Windows 的「网络连接」面板（Win+R 输入 `ncpa.cpl`），应该能看到一个名为 `Mihomo` 的虚拟网卡，状态是「已连接」。再打开命令行执行 `ping 8.8.8.8`，如果能通且延迟正常，说明 TUN 模式已经生效。

完成这四步后，你可以打开浏览器访问一个检查 IP 的网站，看看出口 IP 是否变成了代理节点。如果没变，可以对照 [浏览器检查方法](https://example.com/blog/clash-verge-browser-check/) 排查一下。

## 我踩过的两个坑

第一个坑是**服务模式与 TUN 模式的关系**。我一开始以为装了 Clash Verge 就自带 TUN 功能，结果发现服务模式没装时，TUN 开关虽然能打开，但内核日志会报错。所以务必先装服务，再开 TUN。

第二个坑是**与其他代理工具冲突**。我电脑上还装了一个抓包工具，它也会修改路由表。开启 TUN 模式后，两者打架，导致部分网站打不开。解决办法是先在抓包工具里关闭系统代理，或者临时退出。如果你也遇到类似情况，可以看看 [Clash Verge 与 Clash for Windows 对比](https://example.com/blog/clash-verge-vs-clash-for-windows/) 那篇，里面提到了一些共存建议。

## 常见问题

### Q1：TUN 模式开启后，所有流量都走代理了吗？

不一定。TUN 模式会接管大部分 TCP/UDP 流量，但如果你在配置里写了分流规则（比如直连局域网），那部分流量还是直连。另外，某些应用（如部分杀毒软件）可能绕过虚拟网卡，需要单独设置。

### Q2：服务模式安装失败怎么办？

先检查是否以管理员身份运行 Clash Verge。如果还是失败，尝试在「服务模式」里点「卸载服务」，然后重启电脑再重新安装。极少数情况下需要手动删除 `C:\Program Files\Clash Verge\service` 目录下的残留文件。

### Q3：TUN 模式会影响网速吗？

在我的测试里，TUN 模式比系统代理模式延迟略高 3-5ms，但吞吐量几乎没区别。如果你主要用浏览器，感知不强；如果是游戏玩家，建议用 `System` 栈并关闭 DNS 劫持试试。

### Q4：如何彻底关闭 TUN 模式？

在设置里关闭 TUN 开关，然后点「服务模式」里的「卸载服务」，最后重启电脑。虚拟网卡会自动消失。如果你想连 Clash Verge 一起卸载干净，可以参考 [干净卸载指南](https://example.com/blog/clash-verge-clean-uninstall/)。

## 最后说两句

TUN 模式给我的感觉是「一次配置，长期省心」，尤其适合我这种经常切换网络环境的人。不过它也不是万能的，比如某些需要硬件加速的场景，系统代理反而更稳。建议你根据自己的使用习惯来选。如果后续遇到订阅更新问题，可以翻翻 [订阅更新修复](https://example.com/blog/clash-verge-subscription-update-fix/) 那篇，里头有不少实用技巧。
