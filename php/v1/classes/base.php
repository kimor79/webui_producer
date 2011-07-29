<?php

/**

Copyright (c) 2011, Kimo Rosenbaum and contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the owner nor the names of its contributors
      may be used to endorse or promote products derived from this
      software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

**/

/**
 * WebUIProducer
 * @author Kimo Rosenbaum <kimor79@yahoo.com>
 * @version $Id$
 * @package WebUIProducerBase
 */

class WebUIProducerBase {

	protected $config = array(
		'base_path' => '/',
	);
	protected $default_config_value = '';

	public function __construct($options = array()) {
		if(array_key_exists('config_file', $options)) {
			$ret = $this->parseConfig($options['config_file']);
			if(!$ret) {
				throw new Exception('There is an error with the config file');
			}
		}

		$base_host = $this->getConfig('base_host');
		if(!$base_host) {
			$this->config['base_host'] = $this->buildHost();
		}
	}

	public function __deconstruct() {
	}

	/**
	 * Build a base url pointing to one's self
	 * @return string
	 */
	protected function buildHost() {
		$scheme = 'http';
		$path = '';
		$port = '';

		if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
			$scheme .= 's';
		}

		if(isset($_SERVER['SERVER_PORT']) &&
				$_SERVER['SERVER_PORT'] != 80 &&
				$_SERVER['SERVER_PORT'] != 443) {
			$port = ':' . $_SERVER['SERVER_PORT'];
		}

		return sprintf("%s://%s%s%s", $scheme, $_SERVER['HTTP_HOST'],
			$port, $this->getConfig('base_path'));
	}

	/**
	 * Get a config option
	 * @param string $key
	 * @param string $sub optional sub key
	 * @return mixed
	 */
	public function getConfig($key, $sub = '') {
		if(array_key_exists($key, $this->config)) {
			if(empty($sub)) {
				return $this->config[$key];
			} else {
				return $this->config[$key][$sub];
			}
		}

		return $this->default_config_value;
	}

	/**
	 * Build href (base_path + input)
	 * @param string $path
	 */
	public function buildHref($path = '') {
		return $this->getConfig('base_path') . ltrim($path, '/');
	}

	/**
	 * Give 302
	 * @param string $path relative path
	 * @param int $status status code, default is 302
	 */
	public function giveRedirect($path = '', $status = 302) {
		$location = $this->getConfig('base_host') . ltrim($path, '/');

		header('Status: ' . $status);
		header('Location: ' . $location);
	}

	/**
	 * Show css links
	 * @param array $urls
	 */
	public function showCSSLinks($urls = array()) {
		if(empty($urls)) {
			return;
		}

		while(list($junk, $url) = each($urls)) {
			echo '<link rel="stylesheet" type="text/css" ';
			printf("href=\"%s\">\n", $url);
		}
	}

	/**
	 * Show href (wrapper around buildHref)
	 */
	public function showHref($path = '') {
		echo call_user_func_array(array($this, 'buildHref'),
			func_get_args());
	}

	/**
	 * Show javascript links
	 * @param array $urls
	 */
	public function showJavaScriptLinks($urls = array()) {
		if(empty($urls)) {
			return;
		}

		while(list($junk, $url) = each($urls)) {
			printf("<script type=\"text/javascript\" src=\"%s\">",
				$url);
			echo "</script>\n";
		}
	}

	/**
	 * Show a top-level yui-style tabs menu
	 * @param string $div
	 * @param array $tabs array(dir => title, ...)
	 * @param string $default which tab should be selected by default
	 */
	public function showTabs($div, $tabs, $default = '/') {
		$req_path = dirname($_SERVER['PHP_SELF']);

		printf("<div id=\"%s\" class=\"yui-navset\">\n", $div);
		echo ' <ul class="yui-nav">' . "\n";

		while(list($rdir, $title) = each($tabs)) {
			$dir = ltrim($rdir, '/');
			$href = $this->buildHref($dir);

			echo '  <li';
			if(rtrim($href, '/') == $req_path) {
				echo ' class="selected"';
			}
			echo '>';

			printf("<a href=\"%s\"><em>%s</em></a></li>\n",
				$href, $title);
		}

		echo ' </ul>' . "\n";
		echo '</div>' . "\n";
	}

	/**
	 * Parse ini config file
	 * @param string $file
	 * @return bool
	 */
	public function parseConfig($file) {
		$config = parse_ini_file($file, true);

		if(empty($config)) {
			return false;
		}

		if(array_key_exists('base_path', $config)) {
			$base_path = trim($config['base_path'], '/');

			if($base_path !== '') {
				$this->config['base_path'] = sprintf("/%s/",
					$base_path);
			}

			unset($config['base_path']);
		}

		while(list($key, $value) = each($config)) {
			if(!is_array($value)) {
				$this->config[$key] = $value;
			} else {
				while(list($skey, $sval) = each($value)) {
					$this->config[$key][$skey] = $sval;
				}
			}
		}

		return true;
	}
}

?>
